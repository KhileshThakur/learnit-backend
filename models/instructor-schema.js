const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        required: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    phone: {
        type: Number,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    
    qualification: {
        tenthpc: {
            type: Number,
            required: true,
        },
        twelfthpc: {
            type: Number,
        },
        diplomapc: {
            type: Number,
        },
        
    },
    graduation:{
        gdegree:{
            type: String,
            required: true,
        },

        ginstitute:{
            type: String,
            required: true,
        },

        gyear:{
            type: Number,
            required: true,
        },

        gpc:{
            type: Number,
            required: true,
        },

        gresult: {
            type: Buffer, // to store PDF as binary data
            required: true,
        },
    },
    postgraduation:{
        pdegree:{
            type: String,
        },

        pinstitute:{
            type: String,
        },

        pyear:{
            type: Number,
        },

        ppc:{
            type: Number,
        },

        presult: {
            type: Buffer, 
        },
    },
    expertise: {
        type: [String],
        required: true,
    },
    teachexp:{
        type: Number,
        required: true,
    },
    linkedin:{
        type: String,
        require: true,
    },
    portfolio:{
        type: String,
    },
    resume: {
        type: Buffer, // to store PDF as binary data
        required: true,
    },
    password:{
        type: String,
        required: true,
    }
    
});

const Instructor = mongoose.model('Instructor', instructorSchema);

module.exports = Instructor;
