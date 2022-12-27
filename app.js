//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const { nextTick } = require("process");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
// const md5=require('md5')
// const encrypt = require("mongoose-encryption");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "myLittleSecret",
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true }
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(encrypt, { secret:process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);
// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});
app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});
app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
// app.get("/logout", function(req, res, next) {
//     req.logOut(function(err) {
//       if (err) { return next(err); }
//       res.redirect("/");
//     });
//   });
app.post("/register", function (req, res) {
  //   bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
  //     const newUser = new User({
  //       email: req.body.username,
  //       password: hash,
  //     });
  //     newUser.save(function (err) {
  //       if (err) {
  //         console.log(err);
  //       } else {
  //         res.render("secrets");
  //       }
  //     });
  //   });
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});
app.post("/login", function (req, res) {
  //   const username = req.body.username;
  //   const password = req.body.password;
  //   User.findOne({ email: username }, function (err, foundUser) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       if (foundUser) {
  //         bcrypt.compare(password, foundUser.password, function (err, result) {
  //           if (result === true) {
  //             res.render("secrets");
  //           }
  //         });
  //       }
  //     }
  //   });

  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
