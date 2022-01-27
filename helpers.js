// Create a random string for ShortURL, middleware & userID
const generateRandomString = function() {
  // console.log('generateRandomString helpers ln 3');
  const length = 6;
  const strAlphaNumeric = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let strReturn = '';
  for (let i = 0; i <= length; i++) {
    strReturn += strAlphaNumeric[Math.floor(Math.random() * strAlphaNumeric.length)];
  }
  return strReturn;
};

// Search the objUserList for the email provided in strUserEmail
const findUserByEmail = function(strUserEmail, objUserList) {
  for (const user in objUserList) {
    // console.log('findUserByEmail helpers ln 16);
    if (objUserList[user].email === strUserEmail) {
      return objUserList[user];
    }
  }
  return undefined;
};

// Filter urlDatabase to compare ID's of shortURL with currently logged in user
const urlsForUser = (id, urlDatabase) => {
  // console.log('urlsForUser helpers ln 27
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

module.exports = { generateRandomString, findUserByEmail, urlsForUser };