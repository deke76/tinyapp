const bcrypt = require('bcryptjs');

/**************  URL database ****************/
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 'deke76',
    numVisits: 0,
    visitors: {}
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: 'deke76',
    numVisits: 0,
    visitors: {}
  },
  "dkj784": {
    longURL: "http://www.sportsnet.ca",
    userID: 'abcdef',
    numVisits: 0,
    visitors: {}
  },
  "49gjky": {
    longURL: "http://www.pinterest.ca",
    userID: '12hrg5',
    numVisits: 0,
    visitors: {}
  },
};

/**************  userDB ****************/
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

module.exports = { urlDatabase, userDB };