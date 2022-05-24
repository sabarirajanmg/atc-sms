const mysql = require('../utils/database');

const TABLE = 'phone_number';

const phoneNumber = {
    doesPhoneNumberExist: async (number, account_id) => {
        const result = await mysql.query('SELECT COUNT(*) as count FROM ?? WHERE number=? AND account_id=?', [TABLE, number, account_id]);
        const count = (result && result[0] && result[0].count) || 0;
        return !!count;
    },
};

module.exports = phoneNumber;