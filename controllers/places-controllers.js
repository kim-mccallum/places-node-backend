const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");

const HttpError = require("../models/http-error");

let DUMMY_PLACES = [
  {
    id: "p1",
    title: "Oregon Dunes",
    description:
      "Amazing dune and beach area with twisted shore pines, brackish sand ponds, and tons opportunities to kick up sand and chase critters!",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhW0ROKQAoL-S2nkXUsmkxdrsu8jL2jUfcoA&usqp=CAU",
    address: "855 US-101, Reedsport, OR 97467",
    location: { lat: 43.7035362, lng: -124.1081505 },
    creator: "u1",
  },
  {
    id: "p2",
    title: "Gooseberry Mesa",
    description:
      "Slick rock trails through pinyon juniper with a view of Zion! Great place to chase cows.",
    imageUrl:
      "https://www.doi.gov/sites/doi.gov/files/uploads/ZionNPTomMorrisSmall.jpg",
    address: "Utah 84779",
    location: { lat: 37.1414212, lng: -113.2511208 },
    creator: "u2",
  },
];

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  console.log(placeId);
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find that place REQUEST PROBLEM",
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

const getPlacesByUserId = (req, res, next) => {
  const userId = req.params.uid;
  console.log(userId);
  const places = DUMMY_PLACES.filter((p) => {
    return p.creator === userId;
  });
  console.log(places);
  if (!places || places.length === 0) {
    throw new HttpError(
      "Could not find any places for the provided user id.",
      404
    );
  }
  res.json({ places });
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
    image:
      "https://upload.wikimedia.org/wikipedia/commons/1/10/Empire_State_Building_%28aerial_view%29.jpg",
    creator,
  });

  // console.log(createdPlace);

  try {
    await createdPlace.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }

  //
  res.status(201).json({ place: createdPlace }); //201 is successfully created
};

const updatePlace = (req, res, next) => {
  //look for errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError("Invalid inputs passed, please check your data.", 422);
  }
  //extract the id
  const placeId = req.params.pid;
  // get the new parameters
  const { title, description } = req.body;

  // find the place to update - work on a copy.
  // change the copy and then replace because objects in JS are pass by reference
  const updatedPlace = { ...DUMMY_PLACES.find((p) => p.id === placeId) };
  const placeIndex = DUMMY_PLACES.findIndex((p) => p.id === placeId);
  updatedPlace.title = title;
  updatedPlace.description = description;
  //replace old with new
  DUMMY_PLACES[placeIndex] = updatedPlace;

  // return the response
  res.status(200).json({ place: updatedPlace });
};

const deletePlace = (req, res, next) => {
  const placeId = req.params.pid;
  if (!DUMMY_PLACES.find((p) => p.id === placeId)) {
    throw new HttpError("Could not find that id.", 404);
  }
  DUMMY_PLACES = DUMMY_PLACES.filter((p) => p.id !== placeId);
  res.status(200).json({ message: `Deleted place: ${placeId}` });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
