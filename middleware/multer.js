const multer = require('multer');
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'video/mp4', 'video/mkv'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Unsupported file format"), false);
};

module.exports = multer({ storage, fileFilter });
