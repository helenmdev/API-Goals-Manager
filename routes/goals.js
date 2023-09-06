var express = require("express");
const jwt = require("jsonwebtoken");
const { validationResult, body } = require("express-validator");
const { requestAll, requestOne, createGoal, deleteGoal, updateGoal } = require("../db/request");
var router = express.Router();
const cors = require("cors");

router.use(cors());

const secretKey = 'secret';

// Middleware function to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido" });
    }
    next();
  });
}

// Apply JWT token verification middleware to all routes
router.use(verifyToken);

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
      res.send(goals);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", function (req, res, next) {
  const account_id = req.headers["user-id"];
  const id = req.params.id;
  requestOne("goalsorder", id, account_id, (err, goal) => {
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
    const account_id = req.headers["user-id"];
    createGoal("goalsorder", newGoal, account_id, (err, goal) => {
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
      res.sendStatus(204);
    });
  });
});

module.exports = router;
