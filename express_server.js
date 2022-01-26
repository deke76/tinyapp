// Required constants
const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

// URL database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// user database
const userDB = {
  'deke76': {
    id: "deke76",
    email: "some@email.com",
    password: "p@55w0Rd"
  }
};

// Create a random string for ShortURL & userID
const generateRandomString = function() {
  const length = 6;
  const strAlphaNumeric = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let strReturn = '';
  for (let i = 0; i <= length; i++) {
    strReturn += strAlphaNumeric[Math.floor(Math.random() * strAlphaNumeric.length)];
  }
  return strReturn;
};

// Setup view engine and required middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// Create a new TinyURL from urls_new.ejs
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  console.log('/urls');
  urlDatabase[shortURL] = req.body.longURL;
  const redirectPage = `/urls/${shortURL}`;
  res.redirect(redirectPage);
});

// Create a new userID & registration profile from registration page
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  userDB[userID] = { id: userID,
    password: req.body.password,
    email: req.body.email };
  res.redirect("/urls");
});

// Delete shortURL and longURL
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Update the longURL from urls_show.ejs
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  console.log(`POST /urls/${req.params.id}`);
  res.redirect("/urls");
});

// Create the username on login from _header.ejs
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// Logout username & clear cookie from _header.ejs
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// Navigation button to GET to screen to create new URL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"] };
  console.log('GET urls/new');
  res.render("urls_new", templateVars);
});

// Redirect when shortURL is input
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

// Update the URL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"] };
  console.log(`GET /urls/${req.params.shortURL}`);
  res.render("urls_show", templateVars);
});

// Navigation button to GET to URL index screen
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"] };
  console.log('GET /urls');
  console.log('Cookie:', templateVars.username);
  res.render("urls_index", templateVars);
});

// GET Registration page
app.get("/register", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    email: 'name@example.com' };
  console.log('GET /register');
  console.log(templateVars);
  // if (user.username) res.redirect("/urls");
  // else
  res.render("register.ejs", templateVars);
});

// Return the root directory from urls_index.ejs
app.get("/", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"] };
  console.log('GET /');
  res.render("urls_index", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});