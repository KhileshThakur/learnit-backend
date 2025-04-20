const Thread = require('../../models/DiscussionForum/thread-schema');
const HttpError = require('../../models/http-error');

// Create a new thread/question
const createThread = async (req, res, next) => {
  const { question } = req.body;

  if (!question || question.trim() === '') {
    return next(new HttpError('Question cannot be empty', 422));
  }

  try {
    const newThread = new Thread({ question });
    await newThread.save();
    res.status(201).json({ message: 'Thread created', thread: newThread });
  } catch (err) {
    return next(new HttpError('Failed to create thread', 500));
  }
};

// Get all threads
const getAllThreads = async (req, res, next) => {
  try {
    const threads = await Thread.find();
    res.json({ threads });
  } catch (err) {
    return next(new HttpError('Failed to fetch threads', 500));
  }
};

// Add a reply to a thread
const addReply = async (req, res, next) => {
  const { threadId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return next(new HttpError('Reply cannot be empty', 422));
  }

  try {
    const thread = await Thread.findById(threadId);
    if (!thread) return next(new HttpError('Thread not found', 404));

    thread.replies.push({ content });
    await thread.save();

    res.status(201).json({ message: 'Reply added', thread });
  } catch (err) {
    return next(new HttpError('Failed to add reply', 500));
  }
};

exports.createThread = createThread;
exports.getAllThreads = getAllThreads;
exports.addReply = addReply;
