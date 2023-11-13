var express = require('express');
var router = express.Router();

const UserModel = require('../models/UserModel');

/* GET users listing. */
router.get('/', function(req, res, next) {  
  UserModel.find()
  .then((allUsers) => {
    res.render('users_page', { userData : allUsers });
    console.log('All users:', allUsers);
  })
  .catch((err) => {
    console.error(err);
  });    
});

/* POST to remove user. */
// TODO only admin should be able to remove users
router.post('/remove_user/:name', async function(req, res, next) {
  const userName = req.params.name;    
  try {
    // get emplyee name    
    const deletedUser = await UserModel.findOneAndDelete({ username: userName });

    if (deletedUser) {
      console.log(`User ${userName} removed successfully`);
      // Send a response or redirect the user as needed
      res.redirect('/users');
    } else {
      console.log(`User ${userName} not found`);
      // Send a response indicating that the user was not found
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error removing User:', error.message);
    // Send a response indicating an internal server error
    res.status(500).send('Internal Server Error');
  }    
});

module.exports = router;
