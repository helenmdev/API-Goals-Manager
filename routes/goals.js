var express = require("express");
var jwt = require('express-jwt');
const {
  requestAll,
  requestOne,
  create,
  deleteGoal,
  updateGoal,
} = require("../db/request");
var router = express.Router();
const { body, validationResult } = require("express-validator");

/* GET users listing. */
router.get("/", function (req, res, next) {
  requestAll("goalsorder", req.auth.id, (err, goals) => {
    if (err) {
      return next(err);
    }
    console.log(goals);
    res.send(goals);
  });
});

router.get("/:id", function (req, res, next) {
  const id = req.params.id;
  requestOne("goalsorder", id, (err, goal) => {
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
    create("goalsorder", newGoal, (err, goal) => {
      if (err) {
        return next(err);
      }
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

    if (body.id !== +id) {
      return res.sendStatus(409);
    }
    requestOne("goalsorder", id, (err, goal) => {
      if (err) {
        return next(err);
      }
      if (!goal.length) {
        return res.sendStatus(404);
      }
      updateGoal("goalsorder", id, body, (err, body) => {
        if (err) {
          return next(err);
        }
        res.send(body);
      });
    });
  }
);

router.delete("/:id", function (req, res, next) {
  const id = req.params.id;

  requestOne("goalsorder", id, (err, goal) => {
    if (err) {
      return next(err);
    }
    if (!goal.length) {
      return res.sendStatus(404);
    }

    deleteGoal("goalsorder", id, (err, goal) => {
      if (err) {
        return next(err);
      }
      res.sendStatus(204);
    });
  });
});

module.exports = router;
