const axios = require("axios");
const HttpError = require("../models/http-error");

const API_KEY = "AIzaSyBfWSMtGPtPH_T6kdNuz8vO3bHP8BeUdO0";

//async makes sure that the return value of the function gets wrapped into a promise
async function getCoordsForAddress(address) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );

  const data = response.data;
  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError(
      "Could not find location for the specified address",
      422
    ); //422 for invalid input
    throw error;
  }

  const coordinates = data.results[0].geometry.location;

  return coordinates;
}

module.exports = getCoordsForAddress;
