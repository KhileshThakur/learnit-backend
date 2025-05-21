const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileToCloudinary = async (fileBuffer, folder) => {
  return await cloudinary.uploader.upload_stream({
    resource_type: "raw",  // for pdf or any files
    folder,
  }, (error, result) => {
    if (error) {
      throw new Error(error.message);
    }
    return result;
  }).end(fileBuffer);
};

module.exports = { uploadFileToCloudinary };
