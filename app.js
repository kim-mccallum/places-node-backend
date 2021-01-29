const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");
const DB_USER = process.env.DB_USER;
const DB_PW = process.env.DB_PW;

const app = express();

//parse the body of the incoming request before you pass it to all the routes
app.use(bodyParser.json());
//all files are locked down by default but we can use middleware to serve images
app.use("/uploads/images", express.static(path.join("uploads", "images"))); //add middleware to serve static images

// add middleware to handle CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); //* allows any domain to send request
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Orgin, X-Requested-With, Content-Type, Accept, Authorization"
  ); //this controls which headers the incoming request can have
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

//middleware to catch requests to unsupported routes
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

//error handling in express - adding error means that this function only triggers with an error
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    }); //delete the file from the request
  }
  //you can only send one response
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured." });
});

//if you can connect to DB then start the server
mongoose
  .connect(
    `mongodb+srv://${DB_USER}:${DB_PW}@cluster0.f0ild.mongodb.net/mern-places?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(5000);
  })
  .catch((error) => {
    console.log(error);
  });
