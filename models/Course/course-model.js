const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor', required: true },
  thumbnail: String,
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
