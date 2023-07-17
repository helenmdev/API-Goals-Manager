const initOptions = {};
const pgp = require('pg-promise')(initOptions);

const cn = {
    user: 'helenmadev',
    password: 'Mimadrememima1',
    host: 'goalsmanager.cgsexibcg76o.us-east-2.rds.amazonaws.com',
    port: 5432,
    database: 'goalsmanager',
};

const db = pgp(cn);

module.exports = db;