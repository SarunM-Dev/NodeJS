// Require Packages
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const database = require("mysql");
const add = express();
const schedule = require('node-schedule');
const stripe = require('stripe')('pk_test_51N6BHVSD094WgqaNtIwn3fRx9IFZHi38Za1Qy6yySSr7z63YyIv4dXlElfSnrVVHas8agwnZ1FVsYOilQIEClUxR00qetJkgxO');
const { v4: uuidv4 } = require('uuid');


add.use(cors());
add.use(fileUpload());
add.use(bodyParser.json());
add.use(express.static("public"));
add.use(bodyParser.urlencoded({ extended: true }));

const store = database.createConnection({
  host: "localhost",
  user: "root",
  password: "Sarun@123",
  database: "fashion_store",
});

store.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Your db was Connected");
  }
});

// Insert the userdata into the database
add.post("/SignUp", (request, response) => {
  const {
    firstname,
    lastname,
    phonenumber,
    email,
    password,
  } = request.body;

  const sql =
    "INSERT INTO user_details (firstname, lastname, phonenumber, email, password, status, effective_from, effective_to, created_by, created_on) VALUES (?, ?, ?, ?, ?,'A',current_timestamp(),current_timestamp()+interval 2 year,?, current_timestamp())";

  store.query(
    sql,
    [
      firstname,
      lastname,
      phonenumber,
      email,
      password,
      "user",
    ],
    (error, result) => {
      if (error) {
        console.log(error);
        const a = { status: "error", message: "Registration unsuccessful!" };
        response.status(500).send(a);
      } else {
        const a = { status: "success", message: "Registration successful!" };
        response.status(200).send(a);
        console.log("Registration successful!");
      }
    }
  );
});


add.listen(1000, () => {
  console.log("Server is running on Port 1000");
});

// Check if a user is allowed to login
add.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log(email + "--" + password)
  const sql = "SELECT * FROM user_details WHERE email = ? and status = 'A'";
  store.query(sql, [email], (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).json({ status: "error", message: "Something went wrong" });
      res.send()
    } else {
      if (results.length > 0) {
        const user = results[0];
        console.log(user)
        if (user.password === password) {
          // Login successful
          res.status(200).json({ status: "success", userId: user.id });
          res.send()
          console.log("Login successful!");
        } else {
          // Incorrect password
          res.status(401).json({ status: "error", message: "Incorrect password" });
          res.send()
        }
      } else {
        // User not found
        res.status(404).json({ status: "error", message: "User not found" });
        res.send()
      }
    }
  });
});

// Insert the men product data into the database 
add.post("/insertproduct", (request, response) => {
  const {
    logo,
    itemImg,
    itemName,
    des,
    price,
    effectiveFrom,
    effectiveTo,
  } = request.body;
  const sql =
    "INSERT INTO product (logo, itemImg,itemName, des, price,status, effective_from, effective_to) VALUES ( ?, ?, ?, ?, ?,'A' ,current_timestamp(),current_timestamp()+interval 2 year)";
  store.query(
    sql,
    [
      logo,
      itemImg,
      itemName,
      des,
      price,
      effectiveFrom,
      effectiveTo,
    ],
    (error, result) => {
      if (error) {
        console.log(error);
        const a = { status: "error" };
        response.send(a);
      } else {
        const a = { status: "success" };
        response.send(a);
        console.log("insert successful!");
      }
    }
  );
});
//men product data retrive in database
add.get('/product/:product_id', (req, res) => {
  const product_id = req.params.product_id;
  const sql = 'SELECT product_id, logo,itemImg,itemName,des,price FROM product ';
  store.query(sql, [product_id], (err, result) => {
    if (err) {
      console.log(err);
      res.send('Error fetching data from database');
    } else {
      (store);
      res.send(result)
    }
  });
});

//user select product that product will cart table
add.post("/Addtocart/:userId/:product_id", (request, response) => {
  const {
    product_id,
    logo,
    itemImg,
    itemName,
    des,
    countnumber,
    price,
    totalprice,
  } = request.body;

  const userId = request.params.userId;

  // Validate input
  if (!userId || !product_id || !logo || !itemImg || !itemName || !des || !countnumber || !price || !totalprice) {
    return response.status(400).send({ error: "Missing required fields" });
  }

  const sql =
    "INSERT INTO cart (userId, product_id, logo, itemImg, itemName, des, status, countnumber, price, totalprice, orderdate, created_on, created_by) VALUES (?, ?, ?, ?, ?, ?, 'A', ?, ?, ?, current_timestamp(), current_timestamp(), 'user')";

  // Use placeholders in SQL query
  store.query(
    sql,
    [
      userId,
      product_id,
      logo,
      itemImg,
      itemName,
      des,
      countnumber,
      price,
      totalprice,
    ],
    (error, result) => {
      if (error) {
        console.error(error);
        return response.status(500).send({ error: "Internal server error" });
      } else {
        console.log("Added to cart successfully!");
        return response.status(200).send({ status: "success" });
      }
    }
  );
});




//add to cart api
add.get('/getCardDetails/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = 'SELECT product_id , userId, logo, itemImg, itemName, price ,totalprice, countnumber FROM cart WHERE userId = ? and status = "A"';
  store.query(sql, [userId], (err, result) => {
    if (err) {
      console.log(err);
      res.send('Error fetching product data from database');
    } else {
      console.log(result);
      res.send(result);
    }
  });
});



//update the incerment and decrement in count number
add.post('/updatecart', (req, res) => {
  const product_id = parseInt(req.body.product_id);
  const countnumber = parseInt(req.body.countnumber);
  const userId = parseInt(req.body.userId);
  const totalprice = parseInt(req.body.totalprice)
  const sql = 'UPDATE cart SET countnumber = ? WHERE product_id = ? AND userId = ?';
  store.query(sql, [countnumber, product_id, userId, totalprice], (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error: 'Unable to update cart' });
    } else {
      res.json({ success: true });
    }
  });
});


//delete cart item 
add.post("/deletecart", (req, res) => {
  const userId = parseInt(req.body.userId);
  const product_id = parseInt(req.body.product_id);
  
  const sql = "UPDATE cart SET status = 'I' WHERE userId = ? AND product_id = ?";
  store.query(sql, [userId, product_id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error deleting the product from the cart." });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: `Product with ID ${product_id} is not found in the cart of user ${userId}.` });
    } else {
      res.status(200).json({ message: `Product with ID ${product_id} has been deleted from the cart of user ${userId}.` });
    }
  });
});


//update the totalamount
add.post('/updateamount', (req, res) => {
  const product_id = parseInt(req.body.product_id);
  const totalprice = parseInt(req.body.totalprice);
  const userId = parseInt(req.body.userId);
  const sql = 'UPDATE cart SET totalprice = ? WHERE product_id = ? AND userId = ?';
  store.query(sql, [totalprice, product_id, userId], (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error: 'Unable to update totalprice' });
    } else {
      res.json({ success: true });
    }
  });
});




//payment process in stripe
add.post("/payment", async (req, res) => {
  const token = req.body.token;
  const product = parseInt(req.body.product);
  const transactionKey = uuidv4();
  try {
    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id
    });

    const result = await stripe.charges.create({
      amount: product.price * 100, // Convert to smallest unit of currency
      receipt_email: customer.email,
      currency: "INR",
      customer: customer.id,
      description: product.itemName
    });
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Payment failed" });
  }
});




add.get('/schedulejob', (req, res) => {
  try {

    try {
      schedule.scheduleJob('5 * * * * *', () => {
        console.log(new Date);
      })
      console.log("Successfull")
      res.send("Status : Successfull");
    } catch (apperror) {
      res.send(apperror)
    }
  } catch (systemerror) {
    res.send(systemerror)
  }
})



const express = require('express');
const fs = require('fs');
const SolrNode = require('solr-node');

const app = express();
const port = 4000;
const solrUrl = 'http://localhost:8983/solr';
const collectionName = 'Solr_sample_core'; // Replace with your collection name

app.post('/update', (req, res) => {
  try {
    // Read the JSON file
    const jsonData = fs.readFileSync('./data.json', 'utf8');
    // Parse the JSON data
    const parsedData = JSON.parse(jsonData);
    console.log(parsedData);

    // Create a Solr client
    const solrClient = new SolrNode({
      host: 'localhost',
      port: '8983',
      core: collectionName,
      protocol: 'http',
      debugLevel: 'ERROR' // Set the desired debug level
    });

    // Index the JSON data
    solrClient.update(parsedData, (err, result) => {
      if (err) {
        console.error('Error indexing documents:', err);
        res.status(500).json({ error: 'Error indexing documents' });
      } else {
        console.log('Documents indexed successfully.');
        res.json({ message: 'Documents indexed successfully' });
      }
    });
  } catch (err) {
    console.error('Error reading JSON file:', err);
    res.status(500).json({ error: 'Error reading JSON file' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



















