const express = require('express');
const router = express.Router();

const {
  createThread,
  getAllThreads,
  addReply
} = require('../../controller/DiscussionForum/discussion-controller');

// POST /api/discussion/thread
router.post('/thread', createThread);

// GET /api/discussion/threads
router.get('/threads', getAllThreads);

// POST /api/discussion/thread/:threadId/reply
router.post('/thread/:threadId/reply', addReply);

module.exports = router;
