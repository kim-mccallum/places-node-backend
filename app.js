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

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

//middleware to catch requests to unsupported routes
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

//error handling in express - adding error means that this function only triggers with an error
app.use((error, req, res, next) => {
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
    `mongodb+srv://${DB_USER}:${DB_PW}@cluster0.f0ild.mongodb.net/places?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(5000);
  })
  .catch((error) => {
    console.log(error);
  });
