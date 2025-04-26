const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Thread",
    required: true,
  },
  authorType: {
    type: String,
    enum: ["Learner", "Instructor"],
    required: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "authorType",
  },
  authorName: {
    type: String,
    required: true,
  },
  
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Reply", replySchema);