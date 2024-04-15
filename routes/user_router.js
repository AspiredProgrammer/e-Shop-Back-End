const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
let User = require("../models/user");

const session = require("express-session");
router.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {},
  })
);

router.post("/register", async (req, res) => {

  await check("name", "Name is required").notEmpty().run(req);
  await check("email", "Email is required").notEmpty().run(req);
  await check("email", "Email is invalid").isEmail().run(req);
  await check("password", "Password is required").notEmpty().run(req);
  await check("confirm_password", "Confirm password is required")
    .notEmpty()
    .run(req);
  await check("confirm_password", "Password and confirm password do not match")
    .equals(req.body.password)
    .run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" }); //this should pop up on client-side as feedback
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ msg: "User created successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/login", async (req, res, next) => {
  
  await check("email", "Email is required").notEmpty().run(req);
  await check("email", "Email is invalid").isEmail().run(req);
  await check("password", "Password is required").notEmpty().run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }
    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }
      const token = jwt.sign({ id: user._id, name: user.name }, "secret", {
        expiresIn: "1h",
      });
      return res.status(200).json({ token });
    });
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout();
  res.status(200).json({ msg: "Logout successful" });
});

module.exports = router;