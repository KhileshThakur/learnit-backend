const mongoose = require('mongoose');

const capsuleMessageSchema = new mongoose.Schema({
  capsuleId: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderType: { type: String, enum: ['learner', 'instructor'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CapsuleMessage', capsuleMessageSchema);
