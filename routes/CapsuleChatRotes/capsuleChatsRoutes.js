const express = require('express');
const router = express.Router();
const CapsuleMessage = require('../../models/capsule-chat'); // Adjust the path as necessary

// Get all messages for a capsule
router.get('/:capsuleId', async (req, res) => {
  const { capsuleId } = req.params;
  try {
    const messages = await CapsuleMessage.find({ capsuleId }).sort({ timestamp: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Fetching messages failed.' });
  }
});

module.exports = router;
