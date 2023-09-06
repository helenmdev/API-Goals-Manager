const initOptions = {};
const pgp = require('pg-promise')(initOptions);

const cn = {
    user: 'postgres',
    password: 'Mimamamemima1',
    host: 'localhost',
    port: 5432,
    database: 'goalsmanager',
};

const db = pgp(cn);

module.exports = db;