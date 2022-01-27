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
  "dkj784": {
    longURL: "http://www.sportsnet.ca",
    userID: 'abcdef'
  },
  "49gjky": {
    longURL: "http://www.pinterest.ca",
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
  '12hrg5': {
    id: '12hrg5',
    email: "first@last.com",
    password: bcrypt.hashSync("test", 10)
  }
};

/********* REGISTRATION *****************************************/
// Create a new userID & registration profile from registration page
app.post("/register", (req, res) => {
  // console.log('POST /register express_server ln 61');
  if ((req.body.password === '') || (req.body.email === '')) {
    res.status(400).redirect("no_reg");
    res.end();
  } else if (findUserByEmail(req.body.email, userDB)) {
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
  // console.log('GET /register express_server ln 81');
  if (req.session["user_id"]) return res.redirect("/urls");
  const templateVars = {
    user: userDB[req.session["user_id"]] };
  return res.render("register.ejs", templateVars);
});

// GET page for non-registered users
app.get("/no_reg", (req, res) => {
  // console.log('GET /no_reg express_server ln 89);
  const templateVars = {
    user: userDB[req.session["user_id"]] };
  return res.render("no_reg", templateVars);
});

// POST button on non-registered page to redirect to registraion page
app.post("/no_reg", (req, res) => {
  // console.log('POST /no_reg express_server ln 97);
  return res.redirect("/register");
});

/************** LOGIN & LOGOUT **********************************/
// Find the user in usersDB on login from _header.ejs
app.get("/login", (req, res) => {
  // console.log('GET /login express_server ln 104');
  if (req.session["user_id"]) return res.redirect("/urls");
  return res.render("login", { user: undefined });
});

// POST the results of the login form and redirect as necessary
app.post("/login", (req, res) => {
  // console.log('POST /login express_server ln 110');
  const currentUser = findUserByEmail(req.body.email, userDB);
  if (currentUser) {
    if (bcrypt.compareSync(req.body.password, currentUser.password)) {
      req.session["user_id"] = currentUser.id;
      return res.render("urls_index", {urls: urlsForUser(currentUser.id, urlDatabase), user: currentUser});
    } else {
      return res.status(403).redirect("/no_login");
    }
  }
  return res.redirect("/no_reg");
});

// Logout username & clear cookie from _header.ejs
app.post("/logout", (req, res) => {
  // console.log('POST /logout express_server ln 126');
  req.session = null;
  return res.redirect('/urls');
});

// GET non-logged in user notice
app.get("/no_login", (req, res) => {
  // console.log('GET /no_login express_server ln 133);
  const templateVars = {
    user: userDB[req.session["user_id"]] };
  return res.render("no_login", templateVars);
});

// POST the logoing form after pushing notification button on no-login page
app.post("/no_login", (req, res) => {
  // console.log('POST /no_login express_server ln 141)
  return res.redirect("/login");
});

/********* URL MANIPULATION **************************************/
// GET notification that user isn't owner of URL
app.get("/not_owner", (req, res) => {
  // console.log('GET /not_owner express_server ln 148');
  const templateVars = {
    user: userDB[req.session["user_id"]] };
  return res.render("not_owner", templateVars);
});

// POST the button to return user to URL index
app.post("/not_owner", (req, res) => {
  // console.log('POST /not_owner express_server ln 156');
  return res.redirect("/urls");
});

// POST a new TinyURL from urls_new.ejs
app.post("/urls", (req, res) => {
  // console.log('POST /urls/new express_server ln 162');
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session["user_id"] };
  const redirectPage = `/urls/${shortURL}`;
  return res.redirect(redirectPage);
});

// GET navigation to screen to create new URL
app.get("/urls/new", (req, res) => {
  // console.log('GET urls/new express_server ln 173');
  if (!req.session["user_id"]) {
    return res.redirect("/no_login");
  }
  const templateVars = {
    user: userDB[req.session["user_id"]] };
  return res.render("urls_new", templateVars);
});

// POST Delete shortURL and longURL
app.post("/urls/:id/delete", (req, res) => {
  // console.log(`POST urls/:${req.params.id}/delete express_server ln 185`);
  if (req.session["user_id"]) {
    if (req.session["user_id"] === urlDatabase[req.params.id].userID) {
      delete urlDatabase[req.params.id];
      return res.redirect("/urls");
    }
    return res.redirect("/not_owner");
  }
  return res.redirect("/no_login");
});

// POST to update the longURL from urls_show.ejs
app.post("/urls/:id", (req, res) => {
  // console.log(`POST /urls/${req.params.id} express_server ln 196`);
  if (req.session["user_id"]) {
    if (req.session["user_id"] !== urlDatabase[req.params.id].userID) {
      return res.redirect("/not_owner");
    } else {
      urlDatabase[req.params.id].longURL = req.body.longURL;
      return res.redirect("/urls");
    }
  }
  return res.redirect("/no_login");
});

// GET the update URL page
app.get("/urls/:id", (req, res) => {
  // console.log(`GET /urls/${urlDatabase[req.params.id].userID} express_server ln 209`);
  if (!urlDatabase.hasOwnProperty(req.params.id)) {
    return res.redirect("/not_owner");
  }
  if (!req.session["user_id"]) {
    return res.redirect("/no_login");
  }
  if (urlDatabase[req.params.id].userID !== req.session["user_id"]) {
    return res.redirect("/not_owner");
  }
  const templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: userDB[req.session["user_id"]] };
  return res.render("urls_show", templateVars);
});

/**************** SITE NAVIGATION ******************************/
// GET Navigation button to URL index screen
app.get("/urls", (req, res) => {
  // console.log('GET /urls express_server ln 220');
  if (!req.session["user_id"]) {
    return res.redirect("/no_login");
  }
  const templateVars = {
    urls: urlsForUser(req.session["user_id"], urlDatabase),
    user: userDB[req.session["user_id"]] };
  return res.render("urls_index", templateVars);
});

// GET redirect when shortURL is input
app.get("/u/:id", (req, res) => {
  console.log(`GET /u/${req.params.id} express_server ln 233`);
  if (urlDatabase[req.params.id] === undefined) {
    console.log(`line 246 ${urlDatabase[req.params.id]}`);
    return res.send("This URL doesn't exist yet");
  }
  res.redirect(urlDatabase[req.params.id].longURL);
});

// GET the root directory from urls_index.ejs
app.get("/", (req, res) => {
  // console.log('GET / express_server ln 239');
  if (!req.session["user_id"]) {
    return res.redirect("/login");
  }
  const templateVars = {
    urls: urlsForUser(req.session["user_id"], urlDatabase),
    user: userDB[req.session["user_id"]] };
  return res.render("urls_index", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});