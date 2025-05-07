// middleware/InsPhoto.js
const multer = require('multer');
const path = require('path');

// Storage location & filename config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/InsProfilePics'); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const InsPhoto = multer({ storage: storage });

module.exports = InsPhoto;
