require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const verifyJWT = require('./middleware/verifyJWT');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');

connectDB();

const app = express();

app.use(express.urlencoded({ extended: false }));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/currentdata', require('./routes/currentData'));
app.use('/register', require('./routes/register'));
app.use('/auth', require('./routes/auth'));
app.use('/refresh', require('./routes/refresh'));
app.use('/logout', require('./routes/logout'));

app.use(verifyJWT);
app.use('/user', require('./routes/user'));



// Start Server
const PORT = process.env.PORT || 5000;

mongoose.connection.on('open', () => {
  console.log('Connected to MongoDB.'); 

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
