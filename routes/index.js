const express = require('express');
const router = express.Router();

const sms = require('../controllers/sms');

router
  .post('/inbound/sms', sms.inboundSMS)
  .post('/outbound/sms', sms.outboundSMS)
  ;

module.exports = router;
