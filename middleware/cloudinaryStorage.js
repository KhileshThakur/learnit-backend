const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'capsule-resources',
      resource_type: 'raw', // because pdf is not an image
      format: 'pdf', // force pdf
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, // timestamp + original name without extension
    };
  },
});

module.exports = storage;
