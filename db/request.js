const db = require("../db/config");

function requestAll(table, account_id, callback) {
  db.any(`SELECT * FROM ${table} WHERE account_id=${account_id}`)
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function requestOne(table, id, callback) {
  db.any(`SELECT * FROM ${table} WHERE id = ${id}`)
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function create(table, item, callback) {
  const keys = Object.keys(item);
  const properties = keys.join(", ");
  const values = keys.map((key) => `'${item[key]}'`).join(', ');

  db.any(`INSERT INTO ${table} (${properties}) VALUES (${values}) returning *`)
    .then(([result]) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function updateGoal(table, id, item, callback) {
  const keys = Object.keys(item);
  const data = keys.map(key => `${key} = '${item[key]}'`).join(", ");

  const sql = `UPDATE ${table} SET ${data} WHERE id = ${id} returning *`;
  db.any(sql)
    .then(([result]) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function deleteGoal(table, id, callback) {
  db.any(`DELETE FROM ${table} WHERE id = ${id} returning *`)
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function getAccount(user, callback) {
  db.any(`SELECT * FROM accounts WHERE username = '${user}'`)
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

module.exports = {
  requestAll,
  requestOne,
  create,
  deleteGoal,
  updateGoal,
  getAccount
};
