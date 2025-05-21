// models/Learner.js
const mongoose = require('mongoose');

const learnerSchema = new mongoose.Schema({
  profilePic: {
    type: String,
    default: '' // store image path like '/uploads/LeaProfilePics/filename.jpg'
  },
  name: { type: String, required: true },
  gender: { type: String, required: true },
  dob: { type: Date, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  college: { type: String, required: true },
  university: { type: String, required: true },
  department: { type: String, required: true },
  gradYear: { type: String, required: true },
  subjects: { type: [String], required: true },
  linkedin: { type: String },
  portfolio: { type: String },
  password: { type: String, required: true },
  bio: {
    type: String,
    default: "No bio added yet"
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }]

}, { timestamps: true });

const Learner = mongoose.model('Learner', learnerSchema);
module.exports = Learner;
