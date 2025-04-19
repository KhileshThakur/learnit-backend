const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor',
        required: true
    },
    thumbnail: {
        type: Buffer,
        required: false
    },
    duration: {
        type: String,
        required: true
    },
    expertise: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course; 