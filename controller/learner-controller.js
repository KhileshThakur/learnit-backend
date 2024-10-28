const nodemailer = require('nodemailer');
const otpStorage = {};

// Email transporter configuration using Ethereal
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'troy41@ethereal.email',
        pass: 'kA8x9teSy6fqjnryAk'
    }
});

// Route to send OTP
async function sendOtp (req, res){
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
  otpStorage[email] = otp;

  const mailOptions = {
    from: 'trever.little@ethereal.email',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// Route to verify OTP
function verifyOtp(req, res){
  const { email, otp } = req.body;
  if (otpStorage[email] && otpStorage[email] == otp) {
    delete otpStorage[email]; // Remove OTP after successful verification
    res.json({ success: true, message: 'OTP verified successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
};

// Export the router
module.exports = {sendOtp, verifyOtp};