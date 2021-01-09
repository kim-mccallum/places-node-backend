const { v4: uuidv4 } = require("uuid");
const HttpError = require("../models/http-error");

const DUMMY_PLACES = [
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

const getPlaceById = (req, res, next) => {
  const placeId = req.params.pid;
  const place = DUMMY_PLACES.find((p) => {
    return p.id === placeId;
  });

  if (!place) {
    // return to stop execution if there is an error
    throw new HttpError("Could not find a place for the provided id.", 404);
  }
  res.json({ place });
};

const getPlaceByUserId = (req, res, next) => {
  const userId = req.params.uid;
  console.log(userId);
  const place = DUMMY_PLACES.find((p) => {
    return p.creator === userId;
  });
  console.log(place);
  if (!place) {
    throw new HttpError(
      "Could not find a place for the provided user id.",
      404
    );
  }
  res.json({ place });
};

const createPlace = (req, res, next) => {
  //use destructuring to get the fields out of the body
  const { title, description, coordinates, address, creator } = req.body;
  const createdPlace = {
    id: uuidv4(),
    title,
    description,
    location: coordinates,
    address,
    creator,
  };
  DUMMY_PLACES.push(createdPlace);

  res.status(201).json({ place: createdPlace }); //201 is successfully created
};

exports.getPlaceById = getPlaceById;
exports.getPlaceByUserId = getPlaceByUserId;
exports.createPlace = createPlace;
