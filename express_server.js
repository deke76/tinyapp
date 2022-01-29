// Required constants
const express = require("express");
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const PORT = 8080; // default port 8080
const { generateRandomString, findUserByEmail, urlsForUser, findUserByID } = require("./helpers");
const { urlDatabase, userDB } = require('./data');

// Setup view engine and required middleware
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: [generateRandomString()]
}));

/********* REGISTRATION *****************************************/
// Create a new userID & registration profile from registration page
app.post("/register", (req, res) => {
  const templateVars = {
    user: undefined,
    errorMsg: ''
  };
  let route = '/urls';
  if ((req.body.password === '') || (req.body.email === '')) {
    templateVars.errorMsg = 'All fields must be filled in.';
    route = 'register';
  } else if (findUserByEmail(req.body.email, userDB)) {
    templateVars.errorMsg = 'Your email is already registered, please login.';
    route = 'login';
  } else {
    const userID = generateRandomString();
    userDB[userID] = {
      id: userID,
      password: bcrypt.hashSync(req.body.password, 10),
      email: req.body.email
    };
    req.session["user_id"] = userID;
    res.redirect("route");
  }
  return res.render(route, templateVars);
});

// GET Registration page
app.get("/register", (req, res) => {
  if (req.session["user_id"]) return res.redirect("/urls");
  const templateVars = {
    user: userDB[req.session["user_id"]],
    errorMsg: ''
  };
  return res.render("register", templateVars);
});

// GET page for non-registered users
app.get("/no_reg", (req, res) => {
  const templateVars = {
    user: userDB[req.session["user_id"]],
    errorMsg: 'That email is not registerd'
  };
  return res.render("register", templateVars);
});

/************** LOGIN & LOGOUT **********************************/
// GET login page without any errors
app.get("/login", (req, res) => {
  if (req.session["user_id"]) return res.redirect("/urls");
  const templateVars = {
    user: undefined,
    errorMsg: ''
  };
  return res.render("login", templateVars);
});

// POST the results of the login form and redirect as necessary
app.post("/login", (req, res) => {
  const currentUser = findUserByEmail(req.body.email, userDB);
  const templateVars = {
    urls: {},
    user: undefined,
    errorMsg: ''
  };
  let route = '';
  if (currentUser) {
    if (bcrypt.compareSync(req.body.password, currentUser.password)) {
      req.session["user_id"] = currentUser.id;
      templateVars.urls = urlsForUser(currentUser.id, urlDatabase);
      templateVars.user = currentUser;
      route = "urls_index";
    } else {
      templateVars.errorMsg = 'Something is wrong with your password or email.  Please try again.';
      route = 'login';
    }
    return res.render(route, templateVars);
  }
  return res.redirect("/no_reg");
});

// Logout username, clear cookie from _header.ejs & redirect to urls
app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect('/urls');
});

// GET non-logged in user notice from My URLS or Create New URL
app.get("/no_login", (req, res) => {
  const templateVars = {
    user: userDB[req.session["user_id"]],
    errorMsg: "You need to be logged in to do that."
  };
  return res.render("login", templateVars);
});

/********* URL MANIPULATION **************************************/
// GET notification that user isn't owner of URL
app.get("/not_owner", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session["user_id"], urlDatabase),
    user: userDB[req.session["user_id"]],
    errorMsg: 'That URL doesn\'t belong to you'
  };
  return res.render("urls_index", templateVars);
});

// POST a new TinyURL from urls_new.ejs
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  let tempLongURL = !req.body.longURL.includes('http://')
    ? 'http://' + req.body.longURL
    : req.body.longURL;
  const rightNow = new Date();
  urlDatabase[shortURL] = {
    numVisits: 0,
    visitors: {},
    dateCreated: rightNow.toLocaleString(),
    longURL: tempLongURL,
    userID: req.session["user_id"]
  };
  const redirectPage = `/urls/${shortURL}`;
  return res.redirect(redirectPage);
});

// GET navigate to screen in order to create new URL
app.get("/urls/new", (req, res) => {
  if (!req.session["user_id"]) {
    return res.redirect("/no_login");
  }
  const templateVars = {
    user: userDB[req.session["user_id"]],
    errorMsg: ''
  };
  return res.render("urls_new", templateVars);
});

// DELETE shortURL and longURL
app.delete("/urls/:id", (req, res) => {
  if (req.session["user_id"]) {
    if (req.session["user_id"] === urlDatabase[req.params.id].userID) {
      delete urlDatabase[req.params.id];
      return res.redirect("/urls");
    }
    return res.redirect("/not_owner");
  }
  return res.redirect("/no_login");
});

// PUT update the longURL from urls_show.ejs
app.put("/urls/:id", (req, res) => {
  let tempLongURL = !req.body.longURL.includes('http://')
    ? 'http://' + req.body.longURL
    : req.body.longURL;
  if (req.session["user_id"]) {
    if (req.session["user_id"] !== urlDatabase[req.params.id].userID) {
      return res.redirect("/not_owner");
    } else {
      urlDatabase[req.params.id].longURL = tempLongURL;
      return res.redirect("/urls");
    }
  }
  return res.redirect("/no_login");
});

// GET the update URL page
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    urls: urlDatabase[req.params.id],
    shortURL: req.params.id,
    user: userDB[req.session["user_id"]],
    errorMsg: ''
  };
  console.log(templateVars);
  if (!req.session["user_id"]) {
    return res.redirect("/no_login");
  }
  if (!Object.prototype.hasOwnProperty.call(urlDatabase, req.params.id)) {
    templateVars.urls = urlsForUser(req.session["user_id"], urlDatabase);
    templateVars.errorMsg = "Shortcut Doesn't exist";
    return res.render("urls_index", templateVars);
  }
  if (urlDatabase[req.params.id].userID !== req.session["user_id"]) {
    return res.redirect("/not_owner");
  }
  return res.render("urls_show", templateVars);
});

/**************** SITE NAVIGATION ******************************/
// GET Navigation button to URL index screen
app.get("/urls", (req, res) => {
  if (!req.session["user_id"]) {
    return res.redirect("/no_login");
  }
  const templateVars = {
    urls: urlsForUser(req.session["user_id"], urlDatabase),
    user: userDB[req.session["user_id"]],
    errorMsg: ''
  };
  console.log(templateVars.urls);
  return res.render("urls_index", templateVars);
});

// GET redirect when shortURL is input
app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id] === undefined) {
    const templateVars = {
      user: undefined,
      errorMsg: 'That URL doesn\'t exist yet, maybe you would like to create it?'
    };
    return res.render("register", templateVars);
  }
  urlDatabase[req.params.id].numVisits++;
  // Create a random userID for anyone not logged in
  if (!findUserByID(req.session["user_id"], userDB))  {
    req.session["user_id"] = generateRandomString();
  }
  // Check if the URL has had any visitors, if not create a new key
  if (!Object.prototype.hasOwnProperty.call(urlDatabase[req.params.id].visitors, req.session["user_id"])) {
    urlDatabase[req.params.id].visitors[req.session["user_id"]] = [];
  }

  // Add the timestamp for the correct visitor key
  urlDatabase[req.params.id].visitors[req.session["user_id"]].push(Math.floor(Date.now() / 1000));

  // Clear the the randomly generated ID if they aren't in the userDB
  if (!findUserByID(req.session["user_id"], userDB)) {
    req.session = null;
  }
  res.redirect(urlDatabase[req.params.id].longURL);
});

// GET the root directory from urls_index.ejs
app.get("/", (req, res) => {
  if (!req.session["user_id"]) {
    return res.redirect("/login");
  }
  return res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});