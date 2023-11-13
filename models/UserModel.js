const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  hashed_password: { type: String, required: true },
  salted_password: { type: String, required: true },
});

const UserModel = mongoose.model('UserModel', UserSchema);

module.exports = UserModel;