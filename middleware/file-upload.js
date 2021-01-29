const multer = require("multer");
const uuid = require("uuid");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const fileUpload = multer({
  //tell it where to store and what kind of files to accept
  limits: 500000,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/images");
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype]; //get true or false re: the extension from the multer file object
      cb(null, uuid.v4() + "." + ext);
    },
    fileFilter: (req, file, cb) => {
      const isValid = !!MIME_TYPE_MAP[file.mimetype]; //True or false
      let error = isValid ? null : new Error("Invalid mime type!");
      cb(error, isValid);
    },
  }), //generate a driver
});

module.exports = fileUpload;
