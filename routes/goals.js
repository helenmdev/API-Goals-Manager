const express = require("express");
const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const { body, validationResult } = require("express-validator");
const {
  requestAll,
  requestOne,
  create,
  deleteGoal,
  updateGoal,
  createGoal,
} = require("../db/request");
const cors = require("cors");

const secretKey = 'secret';

const router = express.Router();

const corsOptions = {
  origin: "https://goalsmanager.helenmadev.tech",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

router.use(cors(corsOptions));

// JWT Strategy Configuration
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secretKey,
};

passport.use(new JwtStrategy(jwtOptions, (jwtPayload, done) => {
  done(null, jwtPayload);
}));

// Apply passport middleware for JWT authentication
router.use(passport.authenticate("jwt", { session: false }));

// Get all goals
router.get("/", function (req, res) {
  const account_id = req.user["user-id"]; // Access user data from token
  requestAll("goalsorder", account_id, (err, goals) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
    res.send(goals);
  });
});

// Get a specific goal
router.get("/:id", function (req, res, next) {
  const id = req.params.id;
  requestOne("goalsorder", id, req.user["user-id"], (err, goal) => {
    if (err) {
      return next(err);
    }
    if (!goal.length) {
      return res.sendStatus(404);
    }
    res.send(goal[0]);
  });
});

// Create a new goal
router.post(
  "/",
  [
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
  ],
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const newGoal = req.body;
    createGoal("goalsorder", newGoal, req.user["user-id"], (err, goal) => {
      if (err) {
        return next(err);
      }
      res.send(goal);
    });
  }
);

// Update a goal
router.put(
  "/:id",
  [
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
  ],
  function (req, res, next) {
    const id = req.params.id;
    const body = req.body;
    if (body.id !== +id) {
      return res.sendStatus(409);
    }
    requestOne("goalsorder", id, req.user["user-id"], (err, goal) => {
      if (err) {
        console.log(err);
        return next(err);
      }
      if (!goal.length) {
        return res.sendStatus(404);
      }
      updateGoal("goalsorder", id, body, req.user["user-id"], (err, updatedGoal) => {
        if (err) {
          console.log("update", err);
          return next(err);
        }
        res.send(updatedGoal);
      });
    });
  }
);

// Delete a goal
router.delete('/:id', function (req, res, next) {
  const id = req.params.id;
  requestOne('goalsorder', id, req.user["user-id"], (err, goal) => {
    if (err) {
      return next(err);
    }
    if (!goal.length) {
      return res.sendStatus(404);
    }
    deleteGoal('goalsorder', id, req.user["user-id"], (err) => {
      if (err) {
        return next(err);
      }
      res.sendStatus(204);
    });
  });
});

module.exports = router;
