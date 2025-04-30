const socketIO = require('socket.io');
const mediasoup = require('mediasoup');
const config = require('../config/mediasoup-config');
const Room = require('./Room');
const HttpError = require('../models/http-error');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Store for rooms and workers
const rooms = new Map();
const workers = [];
let nextWorkerIndex = 0;

// Create mediasoup workers
async function createWorkers(numWorkers = 1) {
  console.log(`Creating ${numWorkers} mediasoup workers...`);
  
  for (let i = 0; i < numWorkers; i++) {
    const worker = await mediasoup.createWorker({
      logLevel: config.worker.logLevel,
      logTags: config.worker.logTags,
      rtcMinPort: config.worker.rtcMinPort,
      rtcMaxPort: config.worker.rtcMaxPort
    });
    
    worker.on('died', () => {
      console.error(`Worker ${worker.pid} died, exiting...`);
      setTimeout(() => process.exit(1), 2000);
    });
    
    workers.push(worker);
    console.log(`Created worker with pid ${worker.pid}`);
  }
}

// Get a worker using round-robin
function getWorker() {
  const worker = workers[nextWorkerIndex];
  nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
  return worker;
}

// Get or create a room
async function getOrCreateRoom(roomId) {
  let room = rooms.get(roomId);
  if (!room) {
    const worker = getWorker();
    if (!worker) {
      throw new Error('No workers available');
    }
    
    room = new Room(roomId, worker);
    await room.init();
    rooms.set(roomId, room);
    
    console.log(`Created room ${roomId}`);
  }
  
  return room;
}

// Setup socket.io server
const setupSocketServer = async (server) => {
  console.log('Setting up mediasoup and Socket.IO server...');
  
  // Create mediasoup workers
  const numWorkers = 1;
  await createWorkers(numWorkers);
  
  const io = socketIO(server, {
    path: '/socket.io',
    cors: {
      origin: "*",
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
      
      // Generate a unique peer ID if not provided
      socket.peerId = socket.handshake.auth.userId || decodedToken.userId || `user-${uuidv4()}`;
      socket.userName = socket.handshake.auth.userName || decodedToken.name || 'Anonymous';
      socket.userRole = socket.handshake.auth.userRole || decodedToken.role || 'learner';
      
      console.log(`Socket authenticated: ${socket.userName} (${socket.peerId}) as ${socket.userRole}`);
      next();
    } catch (err) {
      return next(new Error('Authentication failed - invalid token'));
    }
  });

  console.log('Socket.IO server initialized with path /socket.io');

  io.on('connection', async (socket) => {
    console.log('New client connected', socket.id);
    
    // Send immediate connection acknowledgment with peer info
    socket.emit('connection_ack', {
      status: 'connected',
      socketId: socket.id,
      peerId: socket.peerId,
      userName: socket.userName,
      role: socket.userRole
    });
    
    // Get router RTP capabilities
    socket.on('getRouterRtpCapabilities', async ({ roomId }, callback) => {
      try {
        const room = await getOrCreateRoom(roomId);
        if (!room || !room.router) {
          throw new Error('Room or router not found');
        }
        callback({ rtpCapabilities: room.router.rtpCapabilities });
      } catch (error) {
        console.error('Error getting router capabilities:', error);
        callback({ error: error.message });
      }
    });
    
    // Create WebRTC Transport
    socket.on('createWebRtcTransport', async ({ roomId, type }, callback) => {
      try {
        console.log(`Creating ${type} transport for peer ${socket.peerId} in room ${roomId}`);
        
        const room = await getOrCreateRoom(roomId);
        if (!room) {
          throw new Error(`Room ${roomId} not found`);
        }

        // Verify peer exists in room
        const peer = room.getPeer(socket.peerId);
        if (!peer) {
          throw new Error(`Peer ${socket.peerId} not found in room ${roomId}`);
        }

        const transport = await room.createWebRtcTransport(socket.peerId, type);
        callback(transport);
      } catch (error) {
        console.error('Error creating WebRTC transport:', error);
        callback({ error: error.message });
      }
    });
    
    // Connect Transport
    socket.on('connectTransport', async ({ roomId, transportId, dtlsParameters, type }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error(`Room ${roomId} not found`);
        }
        
        const transport = room.getTransport(socket.peerId, type);
        if (!transport) {
          throw new Error(`Transport for peer ${socket.peerId} and type ${type} not found`);
        }
        
        await transport.connect({ dtlsParameters });
        callback({ connected: true });
      } catch (error) {
        console.error('Error connecting transport:', error);
        callback({ error: error.message });
      }
    });
    
    // Produce (send media)
    socket.on('produce', async ({ roomId, transportId, kind, rtpParameters, mediaType }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error(`Room ${roomId} not found`);
        }
        
        const producerId = await room.createProducer(socket.peerId, transportId, rtpParameters, kind, mediaType);
        
        // Notify all peers (except sender) of the new producer
        socket.to(roomId).emit('newProducer', {
          producerId,
          peerId: socket.peerId,
          peerName: socket.userName,
          kind,
          mediaType
        });
        
        callback({ id: producerId });
      } catch (error) {
        console.error('Error producing:', error);
        callback({ error: error.message });
      }
    });
    
    // Consume media
    socket.on('consume', async ({ roomId, producerId, rtpCapabilities, consumerPeerId }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error(`Room ${roomId} not found`);
        }
        
        // Use provided consumer peer ID or fall back to socket peer ID
        const actualConsumerPeerId = consumerPeerId || socket.peerId;
        
        if (!actualConsumerPeerId) {
          throw new Error('Consumer peer ID is required');
        }
        
        console.log(`Consume request from peer ${actualConsumerPeerId} for producer ${producerId}`);
        
        // Validate RTP capabilities
        if (!rtpCapabilities || typeof rtpCapabilities !== 'object') {
          throw new Error('Invalid RTP capabilities');
        }
        
        // Update peer's RTP capabilities if not already set
        room.updatePeerRtpCapabilities(actualConsumerPeerId, rtpCapabilities);
        
        const consumer = await room.createConsumer(actualConsumerPeerId, producerId);
        console.log(`Consumer created for peer ${actualConsumerPeerId}: ${consumer.id}`);
        callback(consumer);
      } catch (error) {
        console.error('Error consuming:', error);
        callback({ error: error.message });
      }
    });
    
    // Resume consumer
    socket.on('resumeConsumer', async ({ roomId, consumerId }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error(`Room ${roomId} not found`);
        }
        
        const consumer = room.consumers.get(consumerId);
        if (!consumer) {
          throw new Error(`Consumer ${consumerId} not found`);
        }
        
        await consumer.resume();
        callback({ resumed: true });
      } catch (error) {
        console.error('Error resuming consumer:', error);
        callback({ error: error.message });
      }
    });
    
    // Join a meeting room
    socket.on('joinRoom', async ({ roomId, userName, userRole }, callback) => {
      try {
        if (!socket.peerId) {
          throw new Error('Peer ID is required');
        }

        console.log(`User ${socket.userName} (${socket.peerId}) joining room ${roomId}`);
        
        const room = await getOrCreateRoom(roomId);
        
        // Add peer to room
        const peer = room.addPeer(socket.peerId, {
          name: userName || socket.userName,
          role: userRole || socket.userRole,
          socketId: socket.id
        });
        
        // Join socket.io room
        socket.join(roomId);
        
        // Get room info
        const peers = room.getPeers();
        const producers = room.getProducerListForPeer();
        
        // Notify others
        socket.to(roomId).emit('userJoined', {
          peerId: socket.peerId,
          peerName: peer.name,
          role: peer.role
        });
        
        callback({
          joined: true,
          peers,
          producers,
          peerId: socket.peerId
        });
      } catch (error) {
        console.error('Error joining room:', error);
        callback({ error: error.message });
      }
    });
    
    // Leave room
    socket.on('leaveRoom', ({ roomId }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (room) {
          const result = room.removePeer(socket.peerId);
          
          // If room is empty, close and remove it
          if (result.peersLeft === 0) {
            console.log(`Room ${roomId} is empty, closing it`);
            room.close();
            rooms.delete(roomId);
          }
          
          // Notify others that user has left
          socket.to(roomId).emit('userLeft', { peerId: socket.peerId });
          
          // Leave socket.io room
          socket.leave(roomId);
        }
        
        if (callback) callback({ left: true });
      } catch (error) {
        console.error('Error leaving room:', error);
        if (callback) callback({ error: error.message });
      }
    });
    
    // Pause/Resume Producer
    socket.on('pauseProducer', async ({ roomId, mediaType }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error(`Room ${roomId} not found`);
        }
        
        await room.pauseProducer(socket.peerId, mediaType);
        
        // Notify all peers
        socket.to(roomId).emit('producerPaused', {
          peerId: socket.peerId,
          mediaType
        });
        
        callback({ paused: true });
      } catch (error) {
        console.error('Error pausing producer:', error);
        callback({ error: error.message });
      }
    });
    
    socket.on('resumeProducer', async ({ roomId, mediaType }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error(`Room ${roomId} not found`);
        }
        
        await room.resumeProducer(socket.peerId, mediaType);
        
        // Notify all peers
        socket.to(roomId).emit('producerResumed', {
          peerId: socket.peerId,
          mediaType
        });
        
        callback({ resumed: true });
      } catch (error) {
        console.error('Error resuming producer:', error);
        callback({ error: error.message });
      }
    });
    
    // Close Producer (stop sharing)
    socket.on('closeProducer', async ({ roomId, mediaType }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error(`Room ${roomId} not found`);
        }
        
        await room.closeProducer(socket.peerId, mediaType);
        
        // Notify all peers
        socket.to(roomId).emit('producerClosed', {
          peerId: socket.peerId,
          mediaType
        });
        
        callback({ closed: true });
      } catch (error) {
        console.error('Error closing producer:', error);
        callback({ error: error.message });
      }
    });
    
    // Chat messages
    socket.on('sendMessage', ({ roomId, message, userId: customUserId, userName: customUserName }) => {
      // Use provided values or fall back to socket values
      const senderId = customUserId || socket.peerId;
      const senderName = customUserName || socket.userName || 'Anonymous';
      const senderRole = socket.userRole || 'learner';
      
      console.log(`Chat message from ${senderName} (${senderId}) in room ${roomId}: ${message.substring(0, 30)}${message.length > 30 ? '...' : ''}`);
      
      const messageWithSender = {
        sender: {
          id: senderId,
          name: senderName,
          role: senderRole
        },
        content: message,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast message to everyone in the room (including sender)
      io.to(roomId).emit('chatMessage', messageWithSender);
    });
    
    // Update peer RTP capabilities
    socket.on('updateRtpCapabilities', async ({ roomId, rtpCapabilities }, callback) => {
      try {
        console.log(`Updating RTP capabilities for peer ${socket.peerId} in room ${roomId}`);
        
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error(`Room ${roomId} not found`);
        }
        
        const updatedPeer = room.updatePeerRtpCapabilities(socket.peerId, rtpCapabilities);
        console.log(`RTP capabilities updated for peer ${socket.peerId}`);
        
        callback({ 
          updated: true,
          peerId: socket.peerId,
          rtpCapabilities: updatedPeer.rtpCapabilities
        });
      } catch (error) {
        console.error('Error updating RTP capabilities:', error);
        callback({ error: error.message });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
      
      // Leave all rooms this socket was in
      for (const [roomId, room] of rooms.entries()) {
        try {
          const result = room.removePeer(socket.peerId);
          
          // If room is empty, close and remove it
          if (result.peersLeft === 0) {
            console.log(`Room ${roomId} is empty, closing it`);
            room.close();
            rooms.delete(roomId);
          } else {
            // Notify others that user has left
            socket.to(roomId).emit('userLeft', { peerId: socket.peerId });
          }
        } catch (error) {
          console.error(`Error removing peer from room ${roomId}:`, error);
        }
      }
    });
  });

  return io;
};

module.exports = setupSocketServer; 