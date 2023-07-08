const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const { expressjwt: jwt, UnauthorizedError } = require("express-jwt");

const indexRouter = require("./routes/index");
const goalsRouter = require("./routes/goals");
const accountsRouter = require("./routes/accounts");
const { authenticateUser } = require("./routes/accounts");

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("secret"));
app.use(express.static(path.join(__dirname, "public")));

const getToken = function fromHeaderOrQuerystring(req) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      return authHeader.slice(7);
    } else if (req.query && req.query.token) {
      return req.query.token;
    } else if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }
    const decodedToken = jwt.verify(token, "secret");
    if (Date.now() >= decodedToken.exp * 1000) {
      throw new UnauthorizedError("Token expired");
    }
    res.send({ message: "Valid token" });
  } catch (err) {
    throw err;
  }
};

app.use(
  "/api",
  jwt({ secret: "secret", algorithms: ["HS256"], getToken }).unless({
    path: [
      "/api/signup",
      "/api/login",
      "/api/forgot_password",
      "/api/reset_password",
      "api/verify",
    ],
  })
);
app.use("/", indexRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/", accountsRouter);
app.use(cookieParser("secret"));


app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  console.error(err);
  res.send(err);
});

app.use(async (req, res, next) => {
  if (req.signedCookies.login) {
    const { username, password } = req.signedCookies.login;
    try {
      const account = await authenticateUser(username, password);
      req.user = account; // set authenticated user on the req object
    } catch (err) {
      console.error(err);
    }
  }
  next();
});

module.exports = app;
