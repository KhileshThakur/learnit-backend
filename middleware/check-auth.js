const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');

module.exports = (req, res, next) => {
  // Skip authentication on OPTIONS requests (for CORS)
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    // Get token from header - format: "Bearer TOKEN"
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new HttpError('Authentication failed - no token provided', 401));
    }

    // Verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_move_to_env');
    
    // Add user data to request
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    return next(new HttpError('Authentication failed - invalid token', 403));
  }
}; 