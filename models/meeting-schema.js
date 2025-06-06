const mongoose = require('mongoose');

const meetingRequestSchema = new mongoose.Schema({
    learner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Learner', required: true },
    instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor', required: true },
    subject: { type: String, required: true },
    topic: { type: String },
    objective: { type: String },
    time: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'pending', 'rejected'], default: 'pending' },
    rejectReason: { type: String }, // Optional field for storing rejection reason
    roomName: { type: String },
    roomId: { type: String },
    joinUrl: { type: String },
});

const Meeting = mongoose.model('Meeting', meetingRequestSchema);
module.exports = Meeting;
