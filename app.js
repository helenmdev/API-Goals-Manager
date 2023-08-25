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

const corsOptions = {
  origin: ['htt://localhost:3001', 'https://goalsmanager.helenmadev.tech'],
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
};

app.use(cors(corsOptions));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("secret"));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  "/api",
  jwt({ secret: "secret", algorithms: ["HS256"], getToken: function fromCookie (req) {
    var token = req.cookies.token || req.body.token || req.query.token || req.headers['authorization'] ;
    if (token) {
      return token;
    } s
    return null;
  }
}).unless({
    path: [
      "/",
      "/login",              
      "/forgot_password",
      "/reset_password",
      "/verify",
    ],
  })
);


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
