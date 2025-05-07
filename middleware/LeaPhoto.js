// middleware/LeaPhoto.js
const multer = require('multer');
const path = require('path');

// Storage location & filename config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/LeaProfilePics'); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const LeaPhoto = multer({ storage: storage });

module.exports = LeaPhoto;
