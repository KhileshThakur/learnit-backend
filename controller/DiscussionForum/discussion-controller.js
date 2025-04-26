const Thread = require('../../models/DiscussionForum/thread-schema');
const Reply = require('../../models/DiscussionForum/reply-schema');
const HttpError = require('../../models/http-error');
const Learner = require('../../models/learnler-schema');
const Instructor = require('../../models/instructor-schema');

// Create a new thread/question
const createThread = async (req, res, next) => {
  const { question, authorType, authorId } = req.body;

  if (!question || question.trim() === '') {
    return next(new HttpError('Question cannot be empty', 422));
  }

  if (!authorType || !authorId) {
    return next(new HttpError('Author information is required', 422));
  }

  try {
    // Fetch name
    let authorName;
    if (authorType === 'Learner') {
      const learner = await Learner.findById(authorId).select('name');
      if (!learner) return next(new HttpError('Learner not found', 404));
      authorName = learner.name;
      
    } else if (authorType === 'Instructor') {
      const instructor = await Instructor.findById(authorId).select('name');
      if (!instructor) return next(new HttpError('Instructor not found', 404));
      authorName = instructor.name;
    }

    const newThread = new Thread({
      question,
      authorType,
      authorId,
      authorName, // 🛠️ Save the fetched name
    });

    await newThread.save();
   

// Fetch again and populate
const populatedThread = await Thread.findById(newThread._id)
  .populate('authorId');

return res.status(201).json({ message: 'Thread created', thread: populatedThread });

  } catch (err) {
    return next(new HttpError('Failed to create thread', 500));
  }
};


// Get all threads (with author names and populated replies)
const getAllThreads = async (req, res, next) => {
  try {
    const threads = await Thread.find()
      .populate('authorId')
      .populate({
        path: 'replies',
        populate: { path: 'authorId' }
      });

    res.json({ threads });
  } catch (err) {
    return next(new HttpError('Failed to fetch threads', 500));
  }
};

// Add a reply to a thread
// Add a reply to a thread
const addReply = async (req, res, next) => {
  const { threadId } = req.params;
  const { content, authorType, authorId } = req.body;

  if (!content || content.trim() === '') {
    return next(new HttpError('Reply cannot be empty', 422));
  }

  if (!authorType || !authorId) {
    return next(new HttpError('Author information is required', 422));
  }

  try {
    const thread = await Thread.findById(threadId);
    if (!thread) return next(new HttpError('Thread not found', 404));

    // Fetch name
    let authorName;
    if (authorType === 'Learner') {
      const learner = await Learner.findById(authorId).select('name');
      if (!learner) return next(new HttpError('Learner not found', 404));
      authorName = learner.name;
    } else if (authorType === 'Instructor') {
      const instructor = await Instructor.findById(authorId).select('name');
      if (!instructor) return next(new HttpError('Instructor not found', 404));
      authorName = instructor.name;
    }

    const newReply = new Reply({
      thread: threadId,
      content,
      authorType,
      authorId,
      authorName,
    });

    await newReply.save();
    thread.replies.push(newReply._id);
    await thread.save();

    // Fetch and populate the new reply properly
    const populatedReply = await Reply.findById(newReply._id)
      .populate('authorId');

    // ✅ Only one response — Send populated reply
    return res.status(201).json({ message: 'Reply added', reply: populatedReply });

  } catch (err) {
    console.error(err); // helpful to log errors
    return next(new HttpError('Failed to add reply', 500));
  }
};





exports.createThread = createThread;
exports.getAllThreads = getAllThreads;
exports.addReply = addReply;
