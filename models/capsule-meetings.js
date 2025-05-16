const mongoose = require("mongoose");

const CapsuleMeetingSchema = new mongoose.Schema({
  capsuleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Capsule",
    required: true
  },
  roomName: { type: String, required: true },
  roomId: { type: String, required: true },
  joinUrl: { type: String, required: true },
  scheduledFor: { type: Date, required: true },  // <-- new field
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CapsuleMeeting", CapsuleMeetingSchema);
