var express = require("express");
const jwt = require("express-jwt");
const {
  requestAll,
  requestOne,
  create,
  deleteGoal,
  updateGoal,
  createGoal,
} = require("../db/request");
var router = express.Router();
const { body, validationResult } = require("express-validator");
const cors = require("cors");

router.use(cors());

const allowedOrigins = [
  "http://localhost:3001",
  "https://goalsmanager.helenmadev.tech",
];

router.get("/", function (req, res, next) {
  try {
    const account_id = req.headers["user-id"];

    requestAll("goalsorder", account_id, (err, goals) => {
      if (err) {
        if (err.name === "UnauthorizedError: jwt expired") {
          res.status(401).json({ error: "JWT expired" });
        } else {
          res.status(500).json({ error: "Internal server error}", err });
        }
        return next(err);
      }
      const origin = req.headers.origin;

      if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
      }
      res.header("Access-Control-Allow-Methods", "GET");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.send(goals);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", function (req, res, next) {
  const account_id = req.headers["user-id"];
  requestOne("goalsorder", id, req.auth.id, (err, goal) => {
    if (err) {
      return next(err);
    }
    if (!goal.length) {
      return res.sendStatus(404);
    }
    const origin = req.headers.origin;

      if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
      }
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.send(goal[0]);
  });
});

router.post(
  "/",
  body("details").not().isEmpty(),
  body("events").not().isEmpty().isInt(),
  body("frequency")
    .not()
    .isEmpty()
    .isIn(["Day", "Week", "Month", "Year", "Lifetime"]),
  body("goal").not().isEmpty().isInt(),
  body("duedate"),
  body("complete").not().isEmpty().isInt(),
  body("completecheck").isBoolean().not().isEmpty(),
  body("icon").not().isEmpty(),

  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const newGoal = req.body;
    console.log(newGoal);
    const account_id = req.headers["user-id"];
    createGoal("goalsorder", newGoal, account_id, (err, goal) => {
      if (err) {
        return next(err);
      }
      const origin = req.headers.origin;

      if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
      }
      res.header("Access-Control-Allow-Methods", "POST");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.send(goal);
    });
  }
);

router.put(
  "/:id",
  body("details").not().isEmpty(),
  body("events").not().isEmpty().isInt(),
  body("frequency")
    .not()
    .isEmpty()
    .isIn(["Day", "Week", "Month", "Year", "Lifetime"]),
  body("goal").not().isEmpty().isInt(),
  body("duedate"),
  body("complete").not().isEmpty().isInt(),
  body("completecheck").isBoolean().not().isEmpty(),
  body("icon").not().isEmpty(),

  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const body = req.body;
    const id = req.params.id;
    const account_id = req.body.account_id;

    if (body.id !== +id) {
      return res.sendStatus(409);
    }
    requestOne("goalsorder", id, account_id, (err, goal) => {
      if (err) {
        console.log(err);
        return next(err);
      }
      if (!goal.length) {
        return res.sendStatus(404);
      }
      updateGoal("goalsorder", id, body, account_id, (err, goal) => {
        if (err) {
          console.log("update", err);
          return next(err);
        }
        const origin = req.headers.origin;

      if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
      }
        res.header("Access-Control-Allow-Methods", "PUT");
        res.header("Access-Control-Allow-Headers", "Content-Type");
        res.send(goal);
      });
    });
  }
);

router.delete("/:id", function (req, res, next) {
  const id = req.params.id;
  const account_id = req.headers["user-id"];
  requestOne("goalsorder", id, account_id, (err, goal) => {
    if (err) {
      return next(err);
    }
    if (!goal.length) {
      return res.sendStatus(404);
    }

    deleteGoal("goalsorder", id, account_id, (err) => {
      if (err) {
        return next(err);
      }
      const origin = req.headers.origin;

      if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
      }
      res.header("Access-Control-Allow-Methods", "DELETE");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.sendStatus(204);
    });
  });
});

module.exports = router;
