const yup = require('yup');
const moment = require('moment');
const asyncJS = require('async');
const { successResponse, errorResponse } = require('../utils/response');
const redisClient = require('../utils/redis');
const { doesPhoneNumberExist } = require('../models/phone_number');

const debug = require('debug')('atc-sms:controllers:sms');

const inValid = field => `${field} is invalid`;
const isMissing = field => `${field} is missing`;

// schema to validate the request body
const requestSchema = yup.object({
    from: yup
        .string(inValid('from'))
        .required(isMissing('from'))
        .min(6, inValid('from'))
        .max(16, inValid('from')),
    to: yup
        .string(inValid('to'))
        .required(isMissing('to'))
        .min(6, inValid('to'))
        .max(16, inValid('to')),
    text: yup
        .string(inValid('text'))
        .required(isMissing('text'))
        .min(1, inValid('text'))
        .max(120, inValid('text')),
});

// to validate the request parameters
const validateRequest = async (body) => {
    let isValid = true, error = '';
    try {
        await requestSchema.validate(body, { abortEarly: false });
    } catch (ex) {
        isValid = false;
        error = ex.errors[0];
    }
    return [isValid, error];
}

// util to form stop key for redis insertion
const getStopKey = (from, to) => `STOP_${from}_${to}`;

module.exports = {
    inboundSMS: async (req, res) => {
        const STOP_EXPIRY_TIME = 4 * 60 * 60; // 4 hours auto expiry time
        const [isValid, error] = await validateRequest(req.body);
        if (!isValid) return errorResponse(res, error)

        const { from, to, text } = req.body;
        // check if to number is linked to user account phone number list
        const numberExists = await doesPhoneNumberExist(to, req.user.id);
        if (!numberExists) return errorResponse(res, 'to parameter not found');

        // if message conatins STOP(\r|\n) add to redis cache 
        if (/^STOP(\r)*(\n)*$/.exec(text)) {
            // if (/STOP\r|\n/.exec(text)) {
            const key = getStopKey(from, to);
            redisClient.set(key, text, () => {
                // set auto expiry for 4 hours
                redisClient.expire(key, STOP_EXPIRY_TIME);
                successResponse(res, 'inbound sms ok');
            });
        } else {
            successResponse(res, 'inbound sms ok');
        }
    },
    outboundSMS: async (req, res) => {
        const MAX_SMS_IN_24_HOURS = 50;
        
        // insert record and send success response
        const insertAndSendSuccess = (from) => {
            const timeStamp = moment().toISOString();
            redisClient.rpush(from, timeStamp, (err) => {
                if (err) return errorResponse(err);
                successResponse(res, 'outbound sms ok');
            });
        };

        // validate the SMS sent time and remove the record if expired 
        const validateAndDeleteExpired = (record, from, cb) => {
            const hours = moment.duration(moment().diff(record)).asHours();
            if (hours >= 24) {
                redisClient.lrem(from, 0, record, (err) => {
                    if (err) return cb(err);
                    cb(null, false);
                });
            } else {
                cb(null, true);
            }
        };

        try {
            const [isValid, error] = await validateRequest(req.body);
            if (!isValid) return errorResponse(res, error);
            const { from, to } = req.body;
            const stopKey = getStopKey(from, to);

            // check if STOP request in cache for given from and to
            redisClient.get(stopKey, (err, stopRequestExists) => {
                if (err) {
                    debug(err);
                    return errorResponse(res);
                }
                if (stopRequestExists) {
                    return successResponse(res, `sms from ${from} to ${to} blocked by STOP request`);
                }

                // get no of records in cache for the from number
                redisClient.llen(from, (err, noOfRecords) => {
                    if (err) return errorResponse(res);
                    // validate and delete messages older than 24 hours
                    if (noOfRecords >= MAX_SMS_IN_24_HOURS) {
                        redisClient.lrange(from, 0, -1, (err, records) => {
                            let validRecords = [];
                            if (err) return errorResponse(err);

                            // remove expired records
                            asyncJS.eachLimit(records, 10, (record, eachCb) => {
                                validateAndDeleteExpired(record, from, (err, isValid) => {
                                    if (err) return eachCb(err);
                                    if (isValid) validRecords.push(record);
                                    eachCb();
                                });
                            }, (err) => {
                                if (err) return errorResponse(res);
                                if (validRecords.length >= MAX_SMS_IN_24_HOURS) {
                                    errorResponse(res, `limit reached for from ${from}`);
                                } else {
                                    insertAndSendSuccess(from);
                                }
                            });
                        });
                    } else {
                        insertAndSendSuccess(from);
                    }
                });
            });
        } catch (ex) {
            debug(ex);
            errorResponse(res);
        }
    },
};
