// Required constants
const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

// Setup view engine and required middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

/***************  DATA  ****************************************/
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

/***************  HELPER FUNCTIONs  *****************************/
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

// Search the objUserList for the email provided in strUserEmail
const findUserByEmail = function(objUserList, strUserEmail) {
  for (const user in objUserList) {
    // console.log('find function:', user.email === strUserEmail);
    if (objUserList[user].email === strUserEmail) {
      console.log('in findbyemail:', objUserList[user]);
      return objUserList[user];
    }
  }
  return null;
};

/********* REGISTRATION *****************************************/
// Create a new userID & registration profile from registration page
app.post("/register", (req, res) => {
  if ((req.body.password === '') || (req.body.email === '')) {
    res.status(400).send("No empty fields allowed.");
    res.end();
  } else if (findUserByEmail(userDB, req.body.email)) {
    console.log('userDB', userDB, 'reg email:', req.body.email);
    res.status(400).send("User already exists!");
    res.end();
  } else {
    const userID = generateRandomString();
    userDB[userID] = {
      id: userID,
      password: req.body.password,
      email: req.body.email };
    res.cookie('user_id', userID);
    res.redirect("/urls");
  }
});

// GET Registration page
app.get("/register", (req, res) => {
  const templateVars = {
    user: userDB[req.cookies["user_id"]] };
  console.log('GET /register');
  console.log(templateVars);
  // if (user.username) res.redirect("/urls");
  // else
  res.render("register.ejs", templateVars);
});

/************** LOGIN & LOGOUT **********************************/
// Find the user in usersDB on login from _header.ejs
app.get("/login", (req, res) => {
  console.log('GET /login');
  res.render("login", { user: undefined });
});

app.post("/login", (req, res) => {
  console.log('POST /login')
  const currentUser = findUserByEmail(userDB, req.body.email);
  console.log('currentUser password:', currentUser.password);
  console.log('entered password', req.body.password);
  if (currentUser.password === req.body.password) {
    res.cookie('user_id', currentUser.id);
    console.log(req.cookies['user_id']);
    console.log(currentUser);
    res.render("urls_index", {urls: urlDatabase, user: currentUser});
  } else {
    res.send("Invalid password.");
    res.end();
  }
});

// Logout username & clear cookie from _header.ejs
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

/********* URL MANIPULATION **************************************/
// Create a new TinyURL from urls_new.ejs
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  console.log('/urls');
  urlDatabase[shortURL] = req.body.longURL;
  const redirectPage = `/urls/${shortURL}`;
  res.redirect(redirectPage);
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

// Update the URL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: userDB[req.cookies["user_id"]] };
  console.log(`GET /urls/${req.params.shortURL}`);
  res.render("urls_show", templateVars);
});

/**************** SITE NAVIGATION ******************************/
// Navigation button to GET to screen to create new URL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: userDB[req.cookies["user_id"]] };
  console.log('GET urls/new', templateVars);
  res.render("urls_new", templateVars);
});

// Navigation button to GET to URL index screen
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: userDB[req.cookies["user_id"]] };
  console.log('GET /urls');
  console.log('user_id:', req.cookies["user_id"]);
  console.log('Cookie:', templateVars);
  res.render("urls_index", templateVars);
});

// Redirect when shortURL is input
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

// Return the root directory from urls_index.ejs
app.get("/", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: userDB[req.cookies["user_id"]] };
  console.log('GET /');
  res.render("urls_index", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});