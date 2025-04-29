const mongoose = require('mongoose');

const capsuleResourceSchema = new mongoose.Schema({
  capsuleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Capsule', // assuming you have a Capsule model, otherwise just keep it
  },
  uploaderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  uploaderType: {
    type: String,
    enum: ['learner', 'instructor'],
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  cloudinaryId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const CapsuleResource = mongoose.model('CapsuleResource', capsuleResourceSchema);

module.exports = CapsuleResource;
