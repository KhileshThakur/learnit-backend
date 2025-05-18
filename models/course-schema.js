// models/Course.js
const mongoose = require('mongoose');

// Schema for individual video inside a course
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true }, // Cloudinary secure_url goes here
  duration: { type: Number }, // in seconds or minutes
}, { _id: false });


// Schema for main course
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  thumbnailUrl: { type: String },
  price: { type: Number, default: 0 }, // 0 means free
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
    required: true
  },
  isPublished: { type: Boolean, default: false },

  videos: [videoSchema], // embedded videos

  enrolledLearners: [{
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Learner' },
    enrolledAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0 } // percentage completed
  }]
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
