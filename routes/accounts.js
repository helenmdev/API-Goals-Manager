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
const cors = require("cors");
router.use(cors());

const secretKey = "secret";

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
        exp: Math.floor(Date.now() / 1000) + 3600,
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
      return res.status(400).json({
        success: false,
        messages: errorMessages,
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
      exp: Math.floor(Date.now() / 1000) + 3600,
      username: email,
      id: accountid,
    },
    "secret"
  );
  return token;
}

router.post("/forgot_password", async (req, res, next) => {
  const email = req.body.headers.email;
  if (!email) {
    return res.status(404).send({ error: "No user found with that email" });
  }
  const token = createToken(email);
  const expiresAt = new Date(moment().add(5, "hour")).toISOString();
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
    const origin = req.headers.origin;
    if (error) {
      return console.log("transporter", error);
    }
    return res.status(200).send("Email sent successfully");
  });
});

router.delete("/delete_account/:id", async (req, res, next) => {
  const id = req.params.id;
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido" });
    }
  });
  deleteAccount(id, (err, res) => {
    if (err) {
      return next(err);
    }
  });
  res.send({ message: "Account deleted successfully" });
});

router.post("/reset_password", async (req, res, next) => {
  const token = req.body.headers.Authorization.split(" ")[1];
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido" });
    }
  });
  try {
    const newPassword = req.body.headers["newpassword"];

    const tokenResult = await checkTokenResult(token);
    if (!tokenResult.id) {
      return res.status(400).send({ error: "User not found" });
    }
    const hashedPassword = bcrypt.hashSync(newPassword, 12);
    await updatePassword(hashedPassword, tokenResult.id);
    await deleteResetToken(tokenResult.id);
    res.send({ message: "Password reset successful" });
  } catch (error) {
    console.error("An error occurred:", error);
    next(error);
  }
});

router.post("/resetuserpassword", async (req, res, next) => {
  try {
    console.log(req.headers);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const { newpassword, user_id } = req.headers;

    const salt = 12;
    const hashedPassword = bcrypt.hashSync(newpassword, salt);
    try {
      await ResetUserPassword(hashedPassword, user_id);
      res.send({ message: "Password reset successful" });
    } catch (error) {
      console.error("An error occurred:", error);
      next(error);
    }
  } catch (error) {
    console.error("An error occurred:", error);
    next(error);
  }
});

module.exports = router;
