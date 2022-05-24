const mysql = require('../utils/database');

const TABLE = 'account';

const account = {
    authenticate: async (username, password) => {
        const user = await mysql.query('SELECT * FROM ?? WHERE username=? AND auth_id=? LIMIT 1', [TABLE, username, password]);
        return user && user[0];
    },
};

module.exports = account;