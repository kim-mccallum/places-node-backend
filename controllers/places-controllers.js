const fs = require("fs");
// const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/location");
const mongoose = require("mongoose");
const Place = require("../models/place");
const User = require("../models/user");

const HttpError = require("../models/http-error");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find that place",
      500
    );
    return next(error);
  }
  //you need both error handling bits
  if (!place) {
    // return to stop execution if there is an error
    const error = new HttpError(
      "Could not find a place for the provided id.",
      404
    );
    return next(error);
  }
  //change the object to normal object and remove MongoDB underscore
  res.json({ place: place.toObject({ getters: true }) }); //getters
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  console.log(userId);
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError(
      "Fetching places for that user failed. Please try again later.",
      500
    );
    return next(error);
  }
  // Check results before sending response
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError("Could not find any places for the provided user id.", 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map((p) => p.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  //look for errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  //use destructuring to get the fields out of the body
  const { title, description, address, creator } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }
  //UPDATE
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path, //path on the server
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Creating place failed. Please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for that id.", 404);
    return next(error);
  }
  console.log(user);

  try {
    //we need to do two things at once so we use a transaction in a session
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess }); //stored the place
    user.places.push(createdPlace); //special mongoose push - grabs place id and adds to user
    await user.save({ session: sess });
    await sess.commitTransaction(); //save changes to DB - if any one fails, everything rolls back
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  //extract the id
  const placeId = req.params.pid;
  // get the new parameters
  const { title, description } = req.body;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    console.log(error);
    const error = new HttpError(
      "Something went wrong, could not update place",
      500
    );
    return next(error);
  }
  //only let users edit their own places
  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place.", 401);
    return next(error);
  }

  //update values
  place.title = title;
  place.description = description;
  //Store the data in the DB
  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }
  // return the response
  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator"); //populate allows you to refer to data in another collection if they are connected
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Could not delete that place.",
      500
    );
    return next(error);
  }
  //check to make sure a place exists
  if (!place) {
    const error = new HttpError("Could not find that place.", 404);
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to delete this place.",
      401
    );
    return next(error);
  }
  const imagePath = place.image;

  try {
    // use a session and transaction
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess }); //remove place
    place.creator.places.pull(place); //pull also removes the id
    await place.creator.save({ session: sess });
    await sess.commitTransaction(); //save changes to DB
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Could not delete that place",
      500
    );
    return next(error);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  }); //delete file

  res.status(200).json({ message: `Deleted place: ${placeId}` });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
