const socketIO = require('socket.io');
const HttpError = require('../models/http-error');
const jwt = require('jsonwebtoken');

const setupSocketServer = (server) => {
  console.log('Setting up Socket.IO server...');
  
  const io = socketIO(server, {
    path: '/socket.io', // Explicitly set the path
    cors: {
      origin: "*", // Use "*" to allow connections from any origin during development
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Add authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication failed - no token provided'));
      }

      // Verify token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_move_to_env');
      socket.userId = decodedToken.userId;
      next();
    } catch (err) {
      return next(new Error('Authentication failed - invalid token'));
    }
  });

  console.log('Socket.IO server initialized with path /socket.io');

  // Debug socket.io instance
  io.engine.on('connection_error', (err) => {
    console.log('Connection error:', err);
  });

  // Store active rooms and users
  const rooms = new Map();
  
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    
    // Immediately send acknowledgment to client
    socket.emit('connection_ack', { status: 'connected', socketId: socket.id });
    
    // Join a room
    socket.on('joinRoom', ({ roomId, userId, userName }) => {
      console.log(`User ${userName} (${userId}) joining room ${roomId}`);
      
      // Create room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      
      const room = rooms.get(roomId);
      
      // Add user to room
      room.set(userId, {
        socketId: socket.id,
        userName,
        userId
      });
      
      // Join room
      socket.join(roomId);
      
      // Store room ID in socket for later use
      socket.roomId = roomId;
      socket.userId = userId;
      
      // Notify other users in the room
      socket.to(roomId).emit('userJoined', { userName, userId });
      
      // Send the list of existing users to the new user
      const users = Array.from(room.values());
      socket.emit('existingUsers', users.filter(user => user.userId !== userId));
      
      // Send acknowledgment back to the user
      socket.emit('joinRoom_ack', { status: 'joined', roomId });
    });
    
    // WebRTC signaling events
    socket.on('offer', ({ to, offer }) => {
      console.log(`Relaying offer from ${socket.id} to ${to}`);
      
      const roomId = socket.roomId;
      if (!roomId) return;
      
      const room = rooms.get(roomId);
      if (!room) return;
      
      const targetUser = Array.from(room.values()).find(user => user.userId === to);
      if (!targetUser) return;
      
      // Relay the offer to the target user
      io.to(targetUser.socketId).emit('offer', {
        from: socket.userId,
        offer
      });
    });
    
    socket.on('answer', ({ to, answer }) => {
      console.log(`Relaying answer from ${socket.id} to ${to}`);
      
      const roomId = socket.roomId;
      if (!roomId) return;
      
      const room = rooms.get(roomId);
      if (!room) return;
      
      const targetUser = Array.from(room.values()).find(user => user.userId === to);
      if (!targetUser) return;
      
      // Relay the answer to the target user
      io.to(targetUser.socketId).emit('answer', {
        from: socket.userId,
        answer
      });
    });
    
    socket.on('iceCandidate', ({ to, candidate }) => {
      const roomId = socket.roomId;
      if (!roomId) return;
      
      const room = rooms.get(roomId);
      if (!room) return;
      
      const targetUser = Array.from(room.values()).find(user => user.userId === to);
      if (!targetUser) return;
      
      // Relay the ICE candidate to the target user
      io.to(targetUser.socketId).emit('iceCandidate', {
        from: socket.userId,
        candidate
      });
    });
    
    // Chat messages
    socket.on('sendMessage', ({ roomId, message }) => {
      // Broadcast message to everyone in the room
      io.to(roomId).emit('chatMessage', message);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
      
      const roomId = socket.roomId;
      const userId = socket.userId;
      
      if (roomId && userId) {
        const room = rooms.get(roomId);
        
        if (room) {
          // Remove user from room
          room.delete(userId);
          
          // If room is empty, delete it
          if (room.size === 0) {
            rooms.delete(roomId);
          } else {
            // Notify others that user has left
            socket.to(roomId).emit('userLeft', { userId });
          }
        }
      }
    });
  });

  return io;
};

module.exports = setupSocketServer; 