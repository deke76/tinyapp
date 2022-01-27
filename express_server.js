// Required constants
const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080

// Setup view engine and required middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

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
    password: "p@55w0Rd"
  },
  'abcdef': {
    id: 'abcdef',
    email: "hello@world.com",
    password: "1234",
  },
  '49gjky': {
    id: '49gjky',
    email: "first@last.com",
    password: "test"
  }
};

/***************  HELPER FUNCTIONs  *****************************/
// Create a random string for ShortURL & userID
const generateRandomString = function() {
  console.log('generateRandomString express_server ln 32');
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
  console.log('findUserByEmail express_server ln 44');
  for (const user in objUserList) {
    // console.log('find function:', user.email === strUserEmail);
    if (objUserList[user].email === strUserEmail) {
      console.log('in findbyemail:', objUserList[user]);
      return objUserList[user];
    }
  }
  return false;
};

// Filter urlDatabase to compare ID's of shortURL with currently logged in user
const urlsForUser = (id) => {
  console.log('in urlsForUser express_server ln 63');
  let userURLS = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLS[url] = {
        longURL: urlDatabase[url].longURL,
        userID: urlDatabase[url].userID
      };
    }
  }
  return userURLS;
};

/********* REGISTRATION *****************************************/
// Create a new userID & registration profile from registration page
app.post("/register", (req, res) => {
  console.log('POST /register express_server ln 58');
  if ((req.body.password === '') || (req.body.email === '')) {
    res.status(400).redirect("no_reg");
    res.end();
  } else if (findUserByEmail(userDB, req.body.email)) {
    console.log('userDB', userDB, 'reg email:', req.body.email);
    res.status(400).redirect("no_login");
    res.end();
  } else {
    const userID = generateRandomString();
    userDB[userID] = {
      id: userID,
      password: bcrypt.hashSync(req.body.password, 10);
      email: req.body.email };
    res.cookie('user_id', userID);
    res.redirect("/urls");
  }
});

// GET Registration page
app.get("/register", (req, res) => {
  console.log('GET /register express_server ln 79');
  const templateVars = {
    user: userDB[req.cookies["user_id"]] };
  res.render("register.ejs", templateVars);
});

// GET page for non-registered users
app.get("/no_reg", (req, res) => {
  const templateVars = {
    user: userDB[req.cookies["user_id"]] };
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
  const currentUser = findUserByEmail(userDB, req.body.email);
  if (currentUser) {
    if (currentUser.password === req.body.password) {
      res.cookie('user_id', currentUser.id);
      res.render("urls_index", {urls: urlsForUser(currentUser.id), user: currentUser});
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
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// GET non-logged in user notice
app.get("/no_login", (req, res) => {
  const templateVars = {
    user: userDB[req.cookies["user_id"]] };
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
    user: userDB[req.cookies["user_id"]] };
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
    userID: req.cookies["user_id"] };
  const redirectPage = `/urls/${shortURL}`;
  res.redirect(redirectPage);
});

// Navigation button to GET to screen to create new URL
app.get("/urls/new", (req, res) => {
  console.log('GET urls/new express_server ln 125');
  if (!req.cookies["user_id"]) {
    res.redirect("/no_login");
  } else {
    const templateVars = {
      user: userDB[req.cookies["user_id"]] };
    res.render("urls_new", templateVars);
  }
});

// Delete shortURL and longURL
app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(`POST urls/:${req.params.shortURL}, express_server ln 133`);
  if (req.cookies["user_id"]) {
    if (req.cookies["user_id"] === urlDatabase[req.params.shortURL].userID) {
      delete urlDatabase[req.params.shortURL];
      res.redirect("/urls");
    } else res.redirect("not_owner");
  } else res.redirect("no_login");
});

// Update the longURL from urls_show.ejs
app.post("/urls/:id", (req, res) => {
  console.log(`POST /urls/${req.params.id} express_server ln 140`);
  if (req.cookies["user_id"]) {
    if (req.cookies["user_id"] !== urlDatabase[req.params.id].userID) {
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
    user: userDB[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

/**************** SITE NAVIGATION ******************************/
// Navigation button to GET to URL index screen
app.get("/urls", (req, res) => {
  console.log('GET /urls express_server ln 178');
  if (!req.cookies["user_id"]) res.redirect("/no_login");
  else {
    const templateVars = {
      urls: urlsForUser(req.cookies["user_id"]),
      user: userDB[req.cookies["user_id"]] };
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
  if (!req.cookies["user_id"]) res.redirect("/login");
  else {
    const templateVars = {
      urls: urlsForUser(req.cookies["user_id"]),
      user: userDB[req.cookies["user_id"]] };
    res.render("urls_index", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});