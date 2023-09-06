const db = require("../db/config");
const cookieParser = require("cookie-parser");

function requestAll(table, account_id, callback) {
  db.any(`SELECT * FROM ${table} WHERE account_id=${account_id} `)
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

  db.any(`INSERT INTO ${table} (${properties}) VALUES (${values}) returning *`)
    .then(([result]) => {
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

function createGoal(table, item, accountid, callback) {
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
  const goaltodelete = `DELETE FROM ${table} WHERE id = ${id} AND account_id=${account_id} returning *`;
  db.any(goaltodelete)
    .then(([result]) => {
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
    `UPDATE accounts SET resettoken = $2, expires_at=$3 WHERE username=$1 RETURNING *`,
    [email, token, expiresAt]
  )
    .then((result) => {
      console.log(result)
      callback(null, result);
    })
    .catch((error) => {
      callback(error);
    });
}

async function checkTokenResult(token) {
  try {
    const query = "SELECT * FROM accounts WHERE resettoken = $1 AND expires_at > NOW()";
    const user = await db.oneOrNone(query, [token]);
    
    if (!user) {
      console.log("No user found with the given token or token has expired.");
    }
    
    return user;
  } catch (error) {
    console.error("Error checking token result:", error);
    throw error;
  }
}



function updatePassword(hashedPassword, accountId) {
  return db.none("UPDATE accounts SET hash = $1 WHERE id = $2", [hashedPassword, accountId]);
}

function deleteResetToken(accountId) {
  return db.none("UPDATE accounts SET resettoken = NULL WHERE id = $1", [accountId]);
}
function ResetUserPassword(hashedPassword, accountId) {
  const updatePass = `UPDATE accounts SET hash = '${hashedPassword}' WHERE id = ${accountId}`;
  db.none(updatePass)
}

module.exports = {
  requestAll,
  requestOne,
  create,
  deleteGoal,
  updateGoal,
  getAccount,
  forgotPassword,
  checkTokenResult,
  updatePassword,
  deleteResetToken,
  deleteAccount,
  createGoal,
  ResetUserPassword,
};
