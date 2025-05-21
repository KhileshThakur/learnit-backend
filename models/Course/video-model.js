const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
}, { _id: true },{ timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
