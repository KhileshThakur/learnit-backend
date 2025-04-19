const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    isLive: {
        type: Boolean,
        default: false
    },
    meetingLink: {
        type: String,
        required: false
    },
    startedAt: {
        type: Date,
        default: null
    },
    streamInfo: {
        type: String,
        required: false
    },
    materials: [{
        title: String,
        fileUrl: String,
        fileType: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class; 