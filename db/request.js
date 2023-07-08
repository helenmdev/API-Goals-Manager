const db = require("../db/config");
const cookieParser = require("cookie-parser");

function requestAll(table, account_id, callback) {
  db.any(`SELECT * FROM ${table} WHERE account_id=${account_id}`)
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function requestOne(table, id, account_id, callback) {
  db.any(
    `SELECT * FROM ${table} WHERE id = ${id} AND account_id=${account_id} `
  )
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
  const values = keys.map((key) => `'${item[key]}'`).join(", ");

  db.any(
    `INSERT INTO ${table} (${properties}) VALUES (${values}) returning *`
  )
    .then(([result]) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function createGoal(table,  item, accountid, callback) {
  const keys = Object.keys(item);
  const properties = keys.join(", ");
  const values = keys.map((key) => `'${item[key]}'`).join(", ");

  db.any(
    `INSERT INTO ${table} (${properties},account_id) VALUES (${values}, ${accountid}) returning *`
  )
    .then(([result]) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function updateGoal(table, id, item, account_id, callback) {
  const keys = Object.keys(item);
  const data = keys.map((key) => `${key} = '${item[key]}'`).join(", ");

  const update = `UPDATE ${table} SET ${data} WHERE id = ${id} AND account_id=${account_id} returning *`;
  db.any(update)
    .then(([result]) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function deleteGoal(table, id, account_id, callback) {
  db.any(
    `DELETE FROM ${table} WHERE id = ${id} AND account_id=${account_id} returning *`
  )
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function getAccount(username) {
  return db.oneOrNone("SELECT * FROM accounts WHERE username=$1", [username]);
}

function deleteAccount(account_id) {
  return db.oneOrNone("DELETE FROM accounts WHERE id=$1", [account_id]);
}

function forgotPassword(email, token, expiresAt, callback) {
  db.any(
    `UPDATE accounts SET resettoken = $2, expires_at=$3 WHERE username=$1`,
    [email, token, expiresAt]
  )
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function checkTokenResult(token, callback) {
  const checkResetToken = `SELECT id FROM accounts WHERE resettoken = '${token}' AND expires_at > NOW()`;
  db.oneOrNone(checkResetToken).then((result) => {
    callback(null, result);
  });
}

function checkUserResult(tokenResult, callback) {
  const userResult = `SELECT * FROM accounts WHERE id = '${tokenResult}'`;
  db.any(userResult)
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function updatePassword(hashedPassword, tokenResult, callback) {
  const updatePass =`UPDATE accounts SET hash = '${hashedPassword}' WHERE id = ${tokenResult}`
  db.none(updatePass)
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function deleteResetToken(tokenResult, callback) {
  const deleteToken = `UPDATE accounts SET resettoken = NULL WHERE id = ${tokenResult};`
  db.none(deleteToken)
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function ResetUserPassword(hashedPassword, accountId, callback) {
  const updatePass =`UPDATE accounts SET hash = '${hashedPassword}' WHERE id = ${accountId}`
  db.none(updatePass)
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
  getAccount,
  checkUserResult,
  forgotPassword,
  checkTokenResult,
  updatePassword,
  deleteResetToken,
  deleteAccount,
  createGoal,
  ResetUserPassword
};
