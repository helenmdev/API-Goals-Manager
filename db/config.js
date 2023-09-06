const initOptions = {};
const pgp = require('pg-promise')(initOptions);

const dbUrl = {
  connectionString: 'postgres://helenmadev:CXpwfhzYKujsm7bIBnIOQIZob9NqSmN2@dpg-cjqd030jbais73a3896g-a.ohio-postgres.render.com/goalsmanager?sslmode=require',
};

const db = pgp(dbUrl);

module.exports = db;
