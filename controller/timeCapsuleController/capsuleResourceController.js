const CapsuleResource = require('../../models/capsule-resource');
const cloudinary = require('../../utils/cloudinary');
const { validationResult } = require('express-validator');

// Upload a resource
exports.uploadResource = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { capsuleId } = req.params;
    const { customFileName } = req.body;

    const uploaderId = req.body.uploaderId;
    const uploaderType = req.body.uploaderType;

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const newResource = new CapsuleResource({
      capsuleId,
      uploaderId,
      uploaderType,
      fileName: customFileName,
      fileUrl: req.file.path,
      cloudinaryId: req.file.filename,
    });

    await newResource.save();

    res.status(201).json({ message: 'Resource uploaded successfully', resource: newResource });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong while uploading' });
  }
};

// Get all resources of a capsule
exports.getResources = async (req, res) => {
  try {
    const { capsuleId } = req.params;

    const resources = await CapsuleResource.find({ capsuleId });

    res.json({ resources });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch resources' });
  }
};

// Delete a resource
exports.deleteResource = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await CapsuleResource.findById(resourceId);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    await cloudinary.uploader.destroy(resource.cloudinaryId, { resource_type: "raw" });
    await resource.deleteOne();

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete resource' });
  }
};
