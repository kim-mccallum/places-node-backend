const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const placesControllers = require("../controllers/places-controllers");

const router = express.Router();

router.get("/:pid", placesControllers.getPlaceById);

router.get("/user/:uid", placesControllers.getPlacesByUserId);
//add protected routes after the above which are not protected
//middleware that checks for valid token
router.use(checkAuth);

//validation required on post requests - you can register multiple middlewares and they get executed in order
router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlace
);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
