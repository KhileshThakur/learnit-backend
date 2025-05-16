const CapsuleChatMessage = require('../../models/capsule-chat');

const getCapsuleMessages = async (req, res, next) => {
    const capsuleId = req.params.capsuleId;

    try {
        const messages = await CapsuleChatMessage.find({ capsuleId }).sort({ timestamp: 1 });
        res.json({ messages });
    } catch (err) {
        console.error('Error fetching capsule messages:', err);
        res.status(500).json({ message: 'Fetching messages failed, please try again later.' });
    }
};

module.exports = {
    getCapsuleMessages
};
