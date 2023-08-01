var express = require("express");
var bcrypt = require("bcrypt");
const {
  create,
  getAccount,
  forgotPassword,
  checkUserResult,
  updatePassword,
  checkTokenResult,
  deleteResetToken,
  deleteAccount,
  ResetUserPassword,
} = require("../db/request");
var router = express.Router();
const { body, validationResult } = require("express-validator");
var jwt = require("jsonwebtoken");
var token = jwt.sign({ foo: "bar" }, "shhhhh");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const moment = require("moment");
const { pool } = require("pg");

const loginValidationMiddleware = [
  body("username").notEmpty().isEmail(),
  body("password").notEmpty(),
];

const singupValidationMiddleware = [
  body("username")
    .notEmpty()
    .isEmail()
    .withMessage("Please enter a valid email"),
  body("password")
    .notEmpty()
    .isLength({ min: 6 })
    .withMessage("Password must have at least 6 characters"),
];

router.post(
  "/login",
  loginValidationMiddleware,
  async function (req, res, next) {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      console.log(validationErrors.errors);
      return res.status(400).json({ errors: validationErrors.array() });
    }
    const { username, password } = req.body;
    try {
      const token = await authenticateUser(username, password);
      res.header(
        "Access-Control-Allow-Origin",
        "https://goalsmanager.helenmadev.tech"
      );
      res.header("Access-Control-Allow-Methods", "POST");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.json({ token });
    } catch (err) {
      if (err.message === "Account not found") {
        res.status(404).json({ error: err.message });
      } else if (err.message === "Invalid password") {
        res.status(401).json({ error: err.message });
      } else {
        next(err);
      }
    }
  }
);

async function authenticateUser(username, password) {
  try {
    const account = await getAccount(username);
    if (!account) {
      throw new Error("Account not found");
    }
    const result = await bcrypt.compare(password, account.hash);
    if (!result) {
      throw new Error("Invalid password");
    }
    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 50,
        id: account.id,
      },
      "secret"
    );
    return { id: account.id, token: token, username };
  } catch (err) {
    throw err;
  }
}

router.post(
  "/signup",
  singupValidationMiddleware,
  async function (req, res, next) {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      const errorMessages = validationErrors.array().map((error) => error.msg);
      res.header(
        "Access-Control-Allow-Origin",
        "https://goalsmanager.helenmadev.tech"
      );
      res.header("Access-Control-Allow-Methods", "POST");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.status(400).json({
        success: false,
        message: errorMessages,
      });
    } else {
      bcrypt.hash(req.body.password, 12, function (err, hash) {
        if (err) {
          return next(err);
        }
        create(
          "accounts",
          { username: req.body.username, hash },
          async (err, account) => {
            if (err) {
              return next(err);
            }
            const token = await authenticateUser(
              req.body.username,
              req.body.password
            );
            res.json({ success: true, token });
          }
        );
      });
    }
  }
);

function createToken(email, accountid) {
  let token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 50,
      username: email,
      id: accountid,
    },
    "secret"
  );
  return token;
}

router.post("/forgot_password", async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    res.header(
      "Access-Control-Allow-Origin",
      "https://goalsmanager.helenmadev.tech"
    );
    res.header("Access-Control-Allow-Methods", "POST");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    return res.status(404).send({ error: "No user found with that email" });
  }

  const token = createToken(email);
  const expiresAt = moment().add(1, "hour").format("YYYY-MM-DD HH:mm:ss");

  forgotPassword(email, token, expiresAt, (err) => {
    if (err) {
      return next(err);
    }
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "helenma.dev@gmail.com",
      pass: "lwegphcqfyusclno",
    },
  });

  const mailOptions = {
    from: "Goals Manager",
    to: email,
    subject: "Goals Manager. Reset your password",
    html: `<p>Click <a href="http://localhost:3001/resetpassword/${token}">here</a> to reset your password.</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log("transporter", error);
    }
    console.log("Email sent: " + info.response);
  });
  res.header(
    "Access-Control-Allow-Origin",
    "https://goalsmanager.helenmadev.tech"
  );
  res.header("Access-Control-Allow-Methods", "POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.send({ message: "Password reset email sent" });
});

router.delete("/delete_account/:id", async (req, res, next) => {
  const id = req.params.id;
  deleteAccount(id, (err, res) => {
    if (err) {
      return next(err);
    }
  });
  res.header(
    "Access-Control-Allow-Origin",
    "https://goalsmanager.helenmadev.tech"
  );
  res.header("Access-Control-Allow-Methods", "DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.send({ message: "Account deleted successfully" });
});

router.post("/reset_password", async (req, res, next) => {
  const { newPassword, token } = req.body;

  checkTokenResult(token, (err, tokenResult) => {
    if (err) {
      return next(err);
    }
    if (!tokenResult.id) {
      return res.status(400).send({ error: "User not found" });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 12);

    checkUserResult(tokenResult.id, (err, userResult) => {
      if (err) {
        return next(err);
      }

      if (!userResult) {
        return res.status(400).send({ error: "User not found" });
      }

      updatePassword(hashedPassword, tokenResult.id, (err, updatePassword) => {
        if (err) {
          return next(err);
        }

        deleteResetToken(tokenResult.id, function (err) {
          if (err) {
            return next(err);
          }
          res.header(
            "Access-Control-Allow-Origin",
            "https://goalsmanager.helenmadev.tech"
          );
          res.header("Access-Control-Allow-Methods", "POST");
          res.header("Access-Control-Allow-Headers", "Content-Type");
          res.send({ message: "Password reset successfully" });
        });
      });
    });
  });
});

router.post("/resetuserpassword", async (req, res, next) => {
  const { newPassword, accountId } = req.body;
  const hashedPassword = bcrypt.hashSync(newPassword, 12);

  ResetUserPassword(hashedPassword, accountId, function (err) {
    if (err) {
      return next(err);
    }
    res.header(
      "Access-Control-Allow-Origin",
      "https://goalsmanager.helenmadev.tech"
    );
    res.header("Access-Control-Allow-Methods", "POST");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.send({ message: "Password successfully changed" });
  });
});

module.exports = router;
