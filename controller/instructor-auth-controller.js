const Instructor = require('../models/instructor-schema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let otps = {};
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'trever.little@ethereal.email',
        pass: 'jueHNKvfrqcqzRKrRX'
    }
});

exports.sendOtp = async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    otps[email] = otp; // Store OTP in memory
    const mailOptions = {
        from: 'trever.little@ethereal.email',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'OTP sent successfully!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error sending OTP. Please try again.' });
    }
};

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (otps[email] === otp) {
        delete otps[email]; // Remove OTP after verification
        return res.status(200).json({ message: 'OTP verified successfully!' });
    } else {
        return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }
};

exports.registerInstructor = async (req, res) => {
    const {
        name,
        gender,
        dob,
        phone,
        email,
        qualification,
        graduation,
        postgraduation,
        expertise,
        teachexp,
        linkedin,
        portfolio,
        password
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const instructor = new Instructor({
        name,
        gender,
        dob,
        phone,
        email,
        qualification: {
            tenthpc: qualification.tenthpc,
            twelfthpc: qualification.twelfthpc,
            diplomapc: qualification.diplomapc,
        },
        graduation: {
            gdegree: graduation.gdegree,
            ginstitute: graduation.ginstitute,
            gyear: graduation.gyear,
            gpc: graduation.gpc,
            gresult: req.files['gresult'][0].buffer,
        },
        postgraduation: {
            pdegree: postgraduation.pdegree,
            pinstitute: postgraduation.pinstitute,
            pyear: postgraduation.pyear,
            ppc: postgraduation.ppc,
            presult: req.files['presult'] ? req.files['presult'][0].buffer : null,
        },
        expertise: expertise.split(','),
        teachexp,
        linkedin,
        portfolio,
        resume: req.files['resume'][0].buffer,
        password: hashedPassword,
    });

    try {
        await instructor.save();
        res.status(201).json(instructor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.authenticateInstructor = async (req, res) => {
    const { email, password } = req.body;

    try {
        const instructor = await Instructor.findOne({ email });
        if (!instructor) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, instructor.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: instructor._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, id: instructor._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};