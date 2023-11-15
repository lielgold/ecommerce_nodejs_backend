var express = require('express');
var router = express.Router();

// dummy database

const USE_FRONT = true;

const ProductModel = require('../models/ProductModel');

const dummy_table_data = [
  { name: 'John Doe', prince: 30, description: 'Developer' },
  { name: 'Jane Smith', prince: 25, description: 'Designer' },
  { name: 'Bob Johnson', prince: 35, description: 'Manager' }
];

async function add_dummy_data(){
  ProductModel.findOne({ name: 'John Doe' })
  .then(result => {
    if (!result) {
      // Insert the dummy data
      return ProductModel.insertMany(dummy_table_data);
    } else {
      console.log('Data already exists. Skipping insertion.');
      return Promise.resolve(); // Resolving with an empty promise for consistency
    }
  })
  .then(() => {
    console.log('Dummy data is in the database');
  })
  .catch(error => {
    console.error('Error inserting dummy data:', error);
  });

}

async function getAllProductData() {
  try {
    const data = await ProductModel.find();
    console.log('got the data');
    //console.log('This works:' + JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error retrieving product data:', error);
    throw error; // Re-throw the error for the calling code to handle
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {  
  await add_dummy_data(); // Assuming add_dummy_data is asynchronous and returns a promise 

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

    // Convert productData to JSON
    //const json_product_data = JSON.stringify(productData);
    //console.log('This should work now:' + JSON.stringify(productData)); // Corrected log statement

    if (USE_FRONT) {
      res.json(productData);
    } else {
      res.render('products_page', { productData });
    }
        
  } catch (error) {
    res.status(500).json({ error: 'Error processing data' });
  }
});

/* POST to create a new product. */
router.post('/products', async function(req, res, next) {
  try {
    // Extracting data from the request body
    const { name, price, description, category } = req.body;

    // Creating a new product with category
    const newProduct = await ProductModel.create({
      name: name,
      price: price,
      description: description,
      category: category, // Include the category field
    });

    // Respond with a success message or the newly created product
    res.redirect('/products');
  } catch (error) {
    console.error('Error creating a new product:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/* POST to remove an prodcut. */
router.post('/remove/:name', async function(req, res, next) {
  // Your logic for handling the POST request to create a new product goes here
  // You can access data from the request body using req.body
  const productName = req.params.name;    
  try {
    // get product name    
    const deletedProduct = await ProductModel.findOneAndDelete({ name: productName });

    if (deletedProduct) {
      console.log(`Product ${deletedProduct} removed successfully`);
      // Send a response or redirect the user as needed
      res.redirect('/products');
    } else {
      console.log(`Product ${deletedProduct} not found`);
      // Send a response indicating that the Product was not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    console.error('Error removing Product:', error.message);
    // Send a response indicating an internal server error
    res.status(500).send('Internal Server Error');
  }
});

/* POST to edit a product. */
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
