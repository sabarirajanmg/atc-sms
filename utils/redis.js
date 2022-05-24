const debug = require('debug')('atc-sms:utils:redis');
const redis = require("redis");
const client = redis.createClient();

client.on("error", function (err) {
    debug("Error " + err);
});

client.on("connect", () => debug('Redis connection successfull'));

module.exports = client;
