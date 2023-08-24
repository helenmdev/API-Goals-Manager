const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const { expressjwt: jwt, UnauthorizedError } = require("express-jwt");
const { createProxyMiddleware } = require('http-proxy-middleware')
const indexRouter = require("./routes/index");
const goalsRouter = require("./routes/goals");
const accountsRouter = require("./routes/accounts");
const { authenticateUser } = require("./routes/accounts");
const cors = require("cors");

const app = express();

app.use(cors());

// Other middlewares and routes should come after the CORS middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("secret"));
app.use(express.static(path.join(__dirname, "public")));

// Exclude /login from JWT authentication
app.use(
  "/api",
  jwt({ secret: "secret", algorithms: ["HS256"] }).unless({
    path: [
      "/",
      "/login",              // Exclude /login from JWT authentication
      "/forgot_password",
      "/reset_password",
      "/verify",
    ],
  })
);

// Your other routes
app.use("/", indexRouter);
app.use("/goals", goalsRouter);
app.use("/", accountsRouter);

app.use(async (req, res, next) => {
  if (req.signedCookies.login) {
    const { username, password } = req.signedCookies.login;
    try {
      const account = await authenticateUser(username, password);
      req.user = account;
    } catch (err) {
      console.error(err);
    }
  }
  next();
});

module.exports = app;
