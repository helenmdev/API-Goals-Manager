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

/* GET users listing. */
router.get("/", function (req, res, next) {
id = req.auth.id 
  requestAll("/goals/goalsorder", id, (err, goals) => {
    if (err) {
      if (err.name === "UnauthorizedError: jwt expired") {
        res.status(401).json({ error: "JWT expired" });
      } else {
        // Handle other types of errors
        res.status(500).json({ error: "Internal server error" });
      }
      return next(err);
    }
    res.send(goals);
  });
});

router.get("/goals/:id", function (req, res, next) {
  const id = req.params.id;
  requestOne("goalsorder", id, req.auth.id, (err, goal) => {
    if (err) {
      return next(err);
    }
    if (!goal.length) {
      return res.sendStatus(404);
    }
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
    createGoal("/goals/goalsorder", newGoal, req.auth.id, (err, goal) => {
      if (err) {
        return next(err);
      }
      res.send(goal);
    });
  }
);

router.put(
  "/goals/:id",
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

    if (body.id !== +id) {
      return res.sendStatus(409);
    }
    requestOne("goals/goalsorder", id, req.auth.id, (err, goal) => {
      if (err) {
        return next(err);
      }
      if (!goal.length) {
        return res.sendStatus(404);
      }
      updateGoal("/goals/goalsorder", id, body, req.auth.id, (err, body) => {
        if (err) {
          return next(err);
        }
        res.send(body);
      });
    });
  }
);

router.delete("/goals/:id", function (req, res, next) {
  const id = req.params.id;

  requestOne("goalsorder", id, req.auth.id, (err, goal) => {
    if (err) {
      return next(err);
    }
    if (!goal.length) {
      return res.sendStatus(404);
    }

    deleteGoal("goalsorder", id, req.auth.id, (err, goal) => {
      if (err) {
        return next(err);
      }
      res.sendStatus(204);
    });
  });
});

module.exports = router;
