var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var hash = require('pbkdf2-password')()
var session = require('express-session'); //TODO remove session and all associated code after front is finished

const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const FRONT_URL = 'http://localhost:4200';
const USE_FRONT = true;
// Secret key used for signing tokens.
const secretKey = 'very_secret_key';


// Enable CORS for only the specified origin (frontend on port 4200)
const corsOptions = {
  origin: FRONT_URL,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// DB code

const mongoose = require('mongoose');
const UserModel = require('./models/UserModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// END DB code


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors(corsOptions));
app.use(bodyParser.json());

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
app.use('/', indexRouter);
app.use('/users', usersRouter);



////// start login code
// config
// middleware

app.use(express.urlencoded({ extended: false }))
app.use(session({
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: 'shhhh, very secret'
}));

// Session-persisted message middleware

app.use(function(req, res, next){
  var err = req.session.error;
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});

// dummy database

var users = {
  tj: { name: 'tj' }
};

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

hash({ password: 'foobar' }, function (err, pass, salt, hash) {
  if (err) throw err;
  // store the salt & hash in the "db"
  users.tj.salt = salt;
  users.tj.hash = hash;
});


// Authenticate using our plain-object database of doom!

function authenticate(name, pass, fn) {
  if (!module.parent) console.log('authenticating %s:%s', name, pass);
  var user = users[name];
  // query the db for the given username
  if (!user) return fn(null, null)
  // apply the same algorithm to the POSTed password, applying
  // the hash against the pass / salt, if there is a match we
  // found the user
  hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
    if (err) return fn(err);
    if (hash === user.hash) return fn(null, user)
    fn(null, null)
  });
}

// Authenticate using our plain-object database of doom!
async function authenticate_v2(name, pass, fn) {
  if (!module.parent) console.log('authenticating %s:%s', name, pass);
  //var user = users[name];
  console.log('searching user'); 

  var user = null;
  

  await UserModel.findOne({ username: name })
  .then((foundUser) => {
    if (foundUser) {
      // User found
      user = foundUser;   
      console.log('User found:', foundUser);      
    } else {
      // User not found
      console.log('User not found');      
    }
  })
  .catch((err) => {
    console.error("there was an error");    
    console.error(err);    
  }); 
  

  // query the db for the given username
  if (!user) return fn(null, null)
  // apply the same algorithm to the POSTed password, applying
  // the hash against the pass / salt, if there is a match we
  // found the user
  hash({ password: pass, salt: user.salted_password }, function (err, pass, salt, hash) {
    if (err) return fn(err);
    if (hash === user.hashed_password) return fn(null, user)
    fn(null, null)
  });
}

function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

app.get('/', function(req, res){
  res.redirect('/login');
});

app.get('/restricted', restrict, function(req, res){
  res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});

app.get('/restricted_page', restrict, function(req, res){
  res.render('restricted_page');
});

// old version, used only on backend
app.get('/logout', function(req, res){
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function(){
    res.redirect('/');    
  });
});

// new version, used in front
app.post('/logout', function(req, res){
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function(){
    //res.redirect('/');
    res.status(200).json({ success: true });
  });
});

app.get('/login', function(req, res){
  var logged_username = '';
  if(req.session.user) logged_username = req.session.user;
  res.render('login', { logged_username });
});

app.post('/login', function (req, res, next) {
  //authenticate(req.body.username, req.body.password, function(err, user){
  authenticate_v2(req.body.username, req.body.password, function(err, user){
    if (err) return next(err)
    if (user) {
      // Regenerate session when signing in
      // to prevent fixation
      req.session.regenerate(function(){
        // Store the user's primary key
        // in the session store to be retrieved,
        // or in this case the entire user object
        req.session.user = req.body.username;
        req.session.success = 'Authenticated as ' + req.body.username
          + ' click to <a href="/logout">logout</a>. '
          + ' You may now access <a href="/restricted">/restricted</a>.';

        // User is authenticated, generate a token
        const payload_username = req.session.user;        
        const token = jwt.sign({ payload_username }, secretKey, { expiresIn: '1h' });

        // Return the token to the client
        if(USE_FRONT) res.json({ token, isUserAdmin: user.isAdmin });
        else {
          res.redirect('back');
        }        
      });
    } else {
      req.session.error = 'Authentication failed, please check your '
        + ' username and password.'
        + ' (use "tj" and "foobar")';
      res.redirect('/login');
    }
  });
});

app.get('/register', function(req, res){
  res.render('register', { error_message: '' });
});

app.post('/register', function (req, res, next) {
  const name = req.body.username;
  const password = req.body.password;
  const retype_password = req.body.retype_password;
  if (password!==retype_password) res.render('register', { error_message: 'Passwords don\'t match'});
  else if (users.hasOwnProperty(name)) res.render('register', { error_message: 'Username already register. Try another one.'});
  else if (name.length ===0 || password.length ===0 || retype_password.length ===0) res.render('register', { error_message: 'You need to fill all fields.'});

  users[name] = password

  hash({ password: password }, function (err, pass, salt, hash) {
    if (err) throw err;
    // store the salt & hash in the "db"
    users.tj.salt = salt;
    users.tj.hash = hash;

    // Using create method with Promises
    UserModel.create({
      username: name.toString(),
      hashed_password: hash,
      salted_password: salt,
    })
      .then((createdUser) => {
        console.log('User created:', createdUser);
        //res.status(200).json({ success: true });
        const name_of_user = createdUser.username;
        const token = jwt.sign({ name_of_user }, secretKey, { expiresIn: '1h' });
        // Return the token to the client        
        return res.status(200).json({ token, isUserAdmin: createdUser.isAdmin });
      })
      .catch((err) => {
        console.error(err);
        return res.status(403)
        //return res.status(403).json({ message: 'Registration failed' });
      });
  });

  req.session.regenerate(function(){
    // Store the user's primary key
    // in the session store to be retrieved,
    // or in this case the entire user object
    req.session.user = name;
    req.session.success = 'Authenticated as ' + name
      + ' click to <a href="/logout">logout</a>. '
      + ' You may now access <a href="/restricted">/restricted</a>.';
    //res.redirect('/');
  });    
});

app.get('/restricted_test', authenticateToken, function(req, res){
  res.status(200);  
});

function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];  
  const tokenWithoutBearer = extractTokenWithBearerPrefix(token);  

  if (!tokenWithoutBearer) return res.status(401).json({ message: 'Unauthorized: Token missing' });

  jwt.verify(tokenWithoutBearer, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden: Token not verified' });
    }

    req.user = user;
    next();
  });

  function extractTokenWithBearerPrefix(tokenWithBearer) {
    // Check if the token starts with "Bearer "
    if (tokenWithBearer.startsWith('Bearer ')) {
      // Split the string to extract the token part
      const tokenWithoutBearer = tokenWithBearer.split('Bearer ')[1];
      return tokenWithoutBearer;
    } else {
      // If the token doesn't start with "Bearer ", return the original token
      return tokenWithBearer;
    }
  }  
}


////// end login code


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;