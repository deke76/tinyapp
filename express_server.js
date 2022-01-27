// Required constants
const express = require("express");
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080
const { generateRandomString, findUserByEmail, urlsForUser } = require("./helpers");

// Setup view engine and required middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: [generateRandomString()]
}));

/***************  DATA  ****************************************/
// URL database
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 'deke76'
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: 'deke76'
  },
  "dkjf784": {
    longURL: "www.sportsnet.ca",
    userID: 'abcdef'
  },
  "49gjky": {
    longURL: "www.pinterest.ca",
    userID: '12hrg5'
  },
};

// user database
const userDB = {
  'deke76': {
    id: "deke76",
    email: "some@email.com",
    password: bcrypt.hashSync("p@55w0Rd", 10)
  },
  'abcdef': {
    id: 'abcdef',
    email: "hello@world.com",
    password: bcrypt.hashSync("1234", 10)
  },
  '49gjky': {
    id: '49gjky',
    email: "first@last.com",
    password: bcrypt.hashSync("test", 10)
  }
};

/********* REGISTRATION *****************************************/
// Create a new userID & registration profile from registration page
app.post("/register", (req, res) => {
  console.log('POST /register express_server ln 58');
  if ((req.body.password === '') || (req.body.email === '')) {
    res.status(400).redirect("no_reg");
    res.end();
  } else if (findUserByEmail(req.body.email, userDB)) {
    console.log('userDB', userDB, 'reg email:', req.body.email);
    res.status(400).redirect("no_login");
    res.end();
  } else {
    const userID = generateRandomString();
    userDB[userID] = {
      id: userID,
      password: bcrypt.hashSync(req.body.password, 10),
      email: req.body.email };
    req.session["user_id"] = userID;
    res.redirect("/urls");
  }
});

// GET Registration page
app.get("/register", (req, res) => {
  console.log('GET /register express_server ln 79');
  const templateVars = {
    user: userDB[req.session["user_id"]] };
  res.render("register.ejs", templateVars);
});

// GET page for non-registered users
app.get("/no_reg", (req, res) => {
  const templateVars = {
    user: userDB[req.session["user_id"]] };
  res.render("no_reg", templateVars);
});

// POST button on non-registered page to redirect to registraion page
app.post("/no_reg", (req, res) => {
  res.redirect("/register");
});

/************** LOGIN & LOGOUT **********************************/
// Find the user in usersDB on login from _header.ejs
app.get("/login", (req, res) => {
  console.log('GET /login express_server ln 88');
  res.render("login", { user: undefined });
});

// POST the results of the login form and redirect as necessary
app.post("/login", (req, res) => {
  console.log('POST /login express_server ln 93');
  const currentUser = findUserByEmail(req.body.email, userDB);
  if (currentUser) {
    if (bcrypt.compareSync(req.body.password, currentUser.password)) {
      req.session["user_id"] = currentUser.id;
      res.render("urls_index", {urls: urlsForUser(currentUser.id, urlDatabase), user: currentUser});
    } else {
      res.status(403);
      res.redirect("no_login");
      res.end();
    }
  } else res.redirect("no_reg");
});

// Logout username & clear cookie from _header.ejs
app.post("/logout", (req, res) => {
  console.log('POST /logout express_server ln 108');
  req.session = null;
  res.redirect('/urls');
});

// GET non-logged in user notice
app.get("/no_login", (req, res) => {
  const templateVars = {
    user: userDB[req.session["user_id"]] };
  res.render("no_login", templateVars);
});

// POST the logoing form after pushing notification button on no-login page
app.post("/no_login", (req, res) => {
  res.redirect("/login");
});

/********* URL MANIPULATION **************************************/
// GET notification that user isn't owner of URL
app.get("/not_owner", (req, res) => {
  const templateVars = {
    user: userDB[req.session["user_id"]] };
  res.render("not_owner", templateVars);
});

// POST the button to return user to URL index
app.post("/not_owner", (req, res) => {
  res.redirect("/urls");
});

// Create a new TinyURL from urls_new.ejs
app.post("/urls/new", (req, res) => {
  console.log('POST /urls/new express_server ln 120');
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session["user_id"] };
  const redirectPage = `/urls/${shortURL}`;
  res.redirect(redirectPage);
});

// Navigation button to GET to screen to create new URL
app.get("/urls/new", (req, res) => {
  console.log('GET urls/new express_server ln 125');
  if (!req.session["user_id"]) {
    res.redirect("/no_login");
  } else {
    const templateVars = {
      user: userDB[req.session["user_id"]] };
    res.render("urls_new", templateVars);
  }
});

// Delete shortURL and longURL
app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(`POST urls/:${req.params.shortURL}, express_server ln 133`);
  if (req.session["user_id"]) {
    if (req.session["user_id"] === urlDatabase[req.params.shortURL].userID) {
      delete urlDatabase[req.params.shortURL];
      res.redirect("/urls");
    } else res.redirect("not_owner");
  } else res.redirect("no_login");
});

// Update the longURL from urls_show.ejs
app.post("/urls/:id", (req, res) => {
  console.log(`POST /urls/${req.params.id} express_server ln 140`);
  if (req.session["user_id"]) {
    if (req.session["user_id"] !== urlDatabase[req.params.id].userID) {
      console.log("POST/URLS");
      res.redirect("/not_owner");
    } else {
      urlDatabase[req.params.id].longURL = req.body.longURL;
      res.redirect("/urls");
    }
  } else res.redirect("no_login");
});

// GET the update URL page
app.get("/urls/:shortURL", (req, res) => {
  console.log(`GET /urls/${req.params} express_server ln 154`);
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: userDB[req.session["user_id"]] };
  res.render("urls_show", templateVars);
});

/**************** SITE NAVIGATION ******************************/
// Navigation button to GET to URL index screen
app.get("/urls", (req, res) => {
  console.log('GET /urls express_server ln 178');
  if (!req.session["user_id"]) res.redirect("/no_login");
  else {
    const templateVars = {
      urls: urlsForUser(req.session["user_id"], urlDatabase),
      user: userDB[req.session["user_id"]] };
    res.render("urls_index", templateVars);
  }
});

// Redirect when shortURL is input
app.get("/u/:shortURL", (req, res) => {
  console.log(`GET /u/${req.params.shortURL} express_server ln 181`);
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

// Return the root directory from urls_index.ejs
app.get("/", (req, res) => {
  console.log('GET / express_server ln 187');
  if (!req.session["user_id"]) res.redirect("/login");
  else {
    const templateVars = {
      urls: urlsForUser(req.session["user_id"], urlDatabase),
      user: userDB[req.session["user_id"]] };
    res.render("urls_index", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});