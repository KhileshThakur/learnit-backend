const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');

const storage = require('../middleware/cloudinaryStorage');
const upload = multer({ storage });

const {
  uploadResource,
  getResources,
  deleteResource,
} = require('../controller/timeCapsuleController/capsuleResourceController');

// Upload Resource
router.post(
  '/upload/:capsuleId',
  upload.single('file'),
  body('customFileName').notEmpty(),
  uploadResource
);

// Get all resources of a capsule
router.get('/:capsuleId', getResources);

// Delete a resource
router.delete('/:resourceId', deleteResource);

module.exports = router;
