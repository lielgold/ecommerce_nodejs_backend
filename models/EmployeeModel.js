const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  age: Number,
  occupation: String
});

const EmployeeModel = mongoose.model('EmployeeModel', EmployeeSchema);

module.exports = EmployeeModel;