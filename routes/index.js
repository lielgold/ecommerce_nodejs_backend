var express = require('express');
var router = express.Router();

// dummy database

const EmployeeModel = require('../models/EmployeeModel');

const dummy_table_data = [
  { name: 'John Doe', age: 30, occupation: 'Developer' },
  { name: 'Jane Smith', age: 25, occupation: 'Designer' },
  { name: 'Bob Johnson', age: 35, occupation: 'Manager' }
];

async function add_dummy_data(){
  EmployeeModel.findOne({ name: 'John Doe' })
  .then(result => {
    if (!result) {
      // Insert the dummy data
      return EmployeeModel.insertMany(dummy_table_data);
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

async function getAllEmployeeData() {
  try {
    const data = await EmployeeModel.find();
    console.log('got the data');
    //console.log('This works:' + JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error retrieving employee data:', error);
    throw error; // Re-throw the error for the calling code to handle
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {  
  await add_dummy_data(); // Assuming add_dummy_data is asynchronous and returns a promise

  try {
    var employeeData = await getAllEmployeeData();

    employeeData = await EmployeeModel.find();

    // Convert employeeData to JSON
    const json_employee_data = JSON.stringify(employeeData);
    // console.log('This should work now:' + json_employee_data); // Corrected log statement

    res.render('index', { title: 'Express', dummy_table_data, json_employee_data });
  } catch (error) {
    res.status(500).json({ error: 'Error processing data' });
  }
});

/* GET product listing page. */
router.get('/products', async function(req, res, next) {  
  //await add_dummy_data(); // Assuming add_dummy_data is asynchronous and returns a promise
  try {
    var employeeData = await getAllEmployeeData();

    // Convert employeeData to JSON
    //const json_employee_data = JSON.stringify(employeeData);
    //console.log('This should work now:' + JSON.stringify(employeeData)); // Corrected log statement

    res.render('products_page', { employeeData });
  } catch (error) {
    res.status(500).json({ error: 'Error processing data' });
  }
});

/* POST to create a new employee. */
router.post('/products', async function(req, res, next) {
  // Your logic for handling the POST request to create a new product goes here
  // You can access data from the request body using req.body
  try {
    // Creating a new employee
    const { name, age, occupation } = req.body;
    const new_employee = await EmployeeModel.create({ name: name, age: age, occupation: occupation },);

    // Respond with a success message or the newly created product
    var employeeData = await getAllEmployeeData();
    res.redirect('/products');
  } catch (error) {
    console.error('Error creating a new product:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/* POST to remove an empolyee. */
router.post('/remove/:name', async function(req, res, next) {
  // Your logic for handling the POST request to create a new product goes here
  // You can access data from the request body using req.body
  const employeeName = req.params.name;    
  try {
    // get emplyee name    
    const deletedEmployee = await EmployeeModel.findOneAndDelete({ name: employeeName });

    if (deletedEmployee) {
      console.log(`Employee ${employeeName} removed successfully`);
      // Send a response or redirect the user as needed
      res.redirect('/products');
    } else {
      console.log(`Employee ${employeeName} not found`);
      // Send a response indicating that the employee was not found
      res.status(404).send('Employee not found');
    }
  } catch (error) {
    console.error('Error removing employee:', error.message);
    // Send a response indicating an internal server error
    res.status(500).send('Internal Server Error');
  }
});

/* POST to edit an empolyee. */
router.post('/edit/:name', async function(req, res, next) {
  const employeeName = req.params.name;
  const { newAge, newOccupation } = req.body;
  try {
    // Use findOneAndUpdate to find and update the employee by name
    const updatedEmployee = await EmployeeModel.findOneAndUpdate(
      { name: employeeName },
      { age: newAge, occupation: newOccupation },
      { new: true } // Return the updated document
    );

    if (updatedEmployee) {
      console.log(`Employee ${employeeName} updated successfully`);
      // Send a response or redirect the user as needed
      res.redirect('/products');
    } else {
      console.log(`Employee ${employeeName} not found`);
      // Send a response indicating that the employee was not found
      res.status(404).send('Employee not found');
    }
  } catch (error) {
    console.error('Error updating employee:', error.message);
    // Send a response indicating an internal server error
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
