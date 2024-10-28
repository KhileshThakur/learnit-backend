// routes/learners.js
const express = require('express');
const Learner = require('../models/learnler-schema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();


let otps = {}; // Store OTPs in memory (for simplicity, consider using a more persistent solution)

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'trever.little@ethereal.email',
        pass: 'jueHNKvfrqcqzRKrRX'
    }
});

router.post('/send-otp', async (req, res) => {
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
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  
  if (otps[email] === otp) {
    delete otps[email]; // Remove OTP after verification
    return res.status(200).json({ message: 'OTP verified successfully!' });
  } else {
    return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
  }
});

// Handle learner registration
router.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        
        const newLearnerData = { ...req.body, password: hashedPassword };
        const newLearner = new Learner(newLearnerData);
        
        await newLearner.save();
        return res.status(201).json({ message: 'Learner account created successfully!', newLearner });
      } catch (error) {
        console.error(error);
        return res.status(400).json({ message: 'Error creating learner account. Please try again.', error });
      }
});

router.post('/auth', async (req, res) => {
  const { email, password } = req.body;

  try {
    const learner = await Learner.findOne({ email });
    if (!learner) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, learner.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: learner._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
