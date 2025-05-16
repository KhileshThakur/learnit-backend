const twilio = require('twilio');
const HttpError = require('../models/http-error');

const getTurnCredentials = async (req, res, next) => {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (!accountSid || !authToken) {
            throw new HttpError('Twilio credentials not configured', 500);
        }

        const client = twilio(accountSid, authToken);
        
        // Create a new Network Traversal Service token
        const token = await client.tokens.create();

        // Extract TURN/STUN server information
        const { iceServers } = token;

        res.json({ iceServers });
    } catch (error) {
        console.error('TURN server error:', error);
        return next(new HttpError('Failed to get TURN server credentials', 500));
    }
};

module.exports = {
    getTurnCredentials
}; 