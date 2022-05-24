const account = require('../models/account');
const response = require('../utils/response');
const debug = require('debug')('atc-sms:middlewares:authentication');

// middleware to authenticate API request using Basic Authentication
async function basicAuth(req, res, next) {

    try {
        // check for basic auth header
        if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
            return response.authenticationFailed(res);
        }

        // verify auth credentials
        const base64Credentials = req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');
        const user = await account.authenticate(username, password);
        if (!user) {
            return response.authenticationFailed(res);
        }

        // attach user to request object
        req.user = user;
        next();
    } catch (ex) {
        debug(ex);
        response.unexpectedError(res);
    }
}

module.exports = { basicAuth };