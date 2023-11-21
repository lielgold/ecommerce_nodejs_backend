var express = require('express');
var router = express.Router();

const USE_FRONT = true;

const ProductModel = require('../models/ProductModel');

async function getAllProductData() {
  try {
    const data = await ProductModel.find();
    console.log('got the data');    
    return data;
  } catch (error) {
    console.error('Error retrieving product data:', error);
    throw error; // Re-throw the error for the calling code to handle
  }
}

/* GET home page. */
/**
 * Used for the temporary backend website.Not actively used in the production Angular frontend.
 */
router.get('/', async function(req, res, next) {  
  //await add_dummy_data(); // Assuming add_dummy_data is asynchronous and returns a promise 
  const dummy_table_data = [
    { name: 'John Doe', prince: 30, description: 'Developer' },
    { name: 'Jane Smith', prince: 25, description: 'Designer' },
    { name: 'Bob Johnson', prince: 35, description: 'Manager' }
  ];

  try {
    var productData = await getAllProductData();

    productData = await ProductModel.find();

    // Convert productData to JSON
    const json_product_data = JSON.stringify(productData);
    // console.log('This should work now:' + json_product_data); // Corrected log statement

    res.render('index', { title: 'Express', dummy_table_data, json_product_data });
  } catch (error) {
    res.status(500).json({ error: 'Error processing data' });
  }
});

/* GET product listing page. */
router.get('/products', async function(req, res, next) {  
  //await add_dummy_data(); // Assuming add_dummy_data is asynchronous and returns a promise
  try {
    var productData = await getAllProductData();
    if (USE_FRONT) {
      res.json(productData);
    } else {
      res.render('products_page', { productData });
    }
        
  } catch (error) {
    res.status(500).json({ error: 'Error processing data' });
  }
});

/* POST to edit a product. */
// not implemented in the frontend
router.post('/edit/:name', async function(req, res, next) {
  const productName = req.params.name;
  const { newPrice, newDescription, newCategory } = req.body;
  try {
    // Use findOneAndUpdate to find and update the product by name
    const updatedProduct = await ProductModel.findOneAndUpdate(
      { name: productName },
      { price: newPrice, description: newDescription, category: newCategory },
      { new: true } // Return the updated document
    );

    if (updatedProduct) {
      console.log(`Product ${updatedProduct} updated successfully`);
      // Send a response or redirect the user as needed
      res.redirect('/products');
    } else {
      console.log(`Product ${updatedProduct} not found`);
      // Send a response indicating that the product was not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    console.error('Error updating product:', error.message);
    // Send a response indicating an internal server error
    res.status(500).send('Internal Server Error');
  }
});


module.exports = router;
