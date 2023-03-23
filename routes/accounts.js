var express = require("express");
var bcrypt = require("bcrypt");
const { create, getAccount } = require("../db/request");
var router = express.Router();
const { body, validationResult } = require("express-validator");
var jwt = require('jsonwebtoken');
var token = jwt.sign({ foo: 'bar' }, 'shhhhh');

router.post(
  "/singup",
  body("username").not().isEmpty().isEmail(),
  body("password").not().isEmpty().isLength({ min: 5 }),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const newAccount = req.body;
    bcrypt.hash(newAccount.password, 12, function (err, hash) {
      if (err) {
        return next(err);
      }
      create(
        "accounts",
        { username: newAccount.username, hash },
        (err, account) => {
          if (err) {
            return next(err);
          }
          res.send(account);
        }
      );
    });
  }
);

router.post(
  "/login",
  body("username").not().isEmpty().isEmail(),
  body("password").not().isEmpty().isLength({ min: 5 }),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const login = req.body;
    getAccount(login.username, (err, [account]) => {
        if (err) {
            return next(err);
          }
          if (!account) {
            return res.sendStatus(404);
          }
          bcrypt.compare(login.password, account.hash, function(err, result) {
            if (err) return next(err);
            if (!result)return res.sendStatus(401);
            let token = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + (60),
                id: account.id
              }, 'secret');
            res.send({token : token});
        });
    })
  }
);

module.exports = router;
