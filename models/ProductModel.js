const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  price: Number,
  description: String,
  category: { type: String, enum: ['yellow', 'red', 'orange'] },
});

const ProductModel = mongoose.model('ProductModel', ProductSchema);

module.exports = ProductModel;
