const express = require("express");
const bodyParser = require("body-parser");

const placesRoutes = require("./routes/places-routes");

const app = express();

//parse the body of the incoming request before you pass it to all the routes
app.use(bodyParser.json());

app.use("/api/places", placesRoutes);

//error handling in express - adding error means that this function only triggers with an error
app.use((error, req, res, next) => {
  //you can only send one response
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured." });
});

app.listen(5000);
