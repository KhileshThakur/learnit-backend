const mongoose = require('mongoose');

const meetingRequestSchema = new mongoose.Schema({
    learner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Learner', required: true },
    instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor', required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    time: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'pending', 'cancelled'], default: 'pending' }
});

const Meeting = mongoose.model('Meeting', meetingRequestSchema);
module.exports = Meeting;
