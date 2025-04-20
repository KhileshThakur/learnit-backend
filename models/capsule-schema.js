const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema({
  learner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Learner",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  }
});

const capsuleSchema = new mongoose.Schema({
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor",
    required: true
  },
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  schedule: [String],
  joinRequests: [joinRequestSchema],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Learner" }]
});

module.exports = mongoose.model("Capsule", capsuleSchema);
