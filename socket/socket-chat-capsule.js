const socketIO = require('socket.io');
const CapsuleMessage = require('../models/capsule-chat');
const Learner = require('../models/learnler-schema');
const Instructor = require('../models/instructor-schema');

const setupCapsuleChatSocket = (server) => {
  const io = socketIO(server, {
    path: '/capsule-chat-socket',
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New Capsule Chat client connected:', socket.id);

    socket.on('joinCapsule', ({ capsuleId }) => {
      socket.join(capsuleId);
      console.log(`Socket ${socket.id} joined capsule ${capsuleId}`);
    });

    socket.on('sendCapsuleMessage', async ({ capsuleId, senderId, senderType, message }) => {
      try {
        // Save to DB
        const newMessage = new CapsuleMessage({
          capsuleId,
          senderId,
          senderType,
          message
        });
        await newMessage.save();

        // Fetch sender name from DB
        let senderName = '';
        if (senderType === 'learner') {
          const learner = await Learner.findById(senderId);
          senderName = learner ? learner.name : 'Unknown Learner';
        } else if (senderType === 'instructor') {
          const instructor = await Instructor.findById(senderId);
          senderName = instructor ? instructor.name : 'Unknown Instructor';
        }

        // Broadcast message
        io.to(capsuleId).emit('receiveCapsuleMessage', {
          _id: newMessage._id,
          capsuleId,
          senderId,
          senderType,
          senderName,
          message,
          timestamp: newMessage.timestamp
        });

      } catch (err) {
        console.error('Error sending capsule message:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('Capsule Chat client disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = setupCapsuleChatSocket;
