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

// Add /goalsmanagerapi prefix to the routes
const goalsPrefix = "/goalsmanagerapi";
const accountsPrefix = "/goalsmanagerapi";

const getToken = function fromHeaderOrQuerystring(req) {
  // ... (your existing getToken function code)
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

// Add the /goalsmanagerapi prefix to the route middlewares
app.use("/", indexRouter);
app.use("goalsmanagerapi/goals", goalsRouter);
app.use("goalsmanagerapi/", accountsRouter);

// ... (your existing error handlers and other middlewares)

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

module.exports =  app;


