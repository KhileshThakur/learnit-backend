const mediasoup = require('mediasoup');
const config = require('../config/mediasoup-config');

class Room {
  constructor(roomId, worker) {
    this.id = roomId;
    this.worker = worker;
    this.router = null;
    this.audioProducers = new Map();
    this.videoProducers = new Map();
    this.screenProducers = new Map();
    this.producers = new Map();
    this.consumers = new Map();
    this.peers = new Map();
    this.transports = new Map();
  }

  async init() {
    try {
      this.router = await this.worker.createRouter({ mediaCodecs: config.router.mediaCodecs });
      console.log(`Room ${this.id} created with router ID: ${this.router.id}`);
      return this.router;
    } catch (error) {
      console.error('Error creating router:', error);
      throw error;
    }
  }

  addPeer(peerId, peerData) {
    console.log(`Adding peer to room ${this.id}:`, { peerId, ...peerData });
    
    if (!peerId) {
      throw new Error('Peer ID is required');
    }

    // Check if peer already exists
    if (this.peers.has(peerId)) {
      console.log(`Peer ${peerId} already exists, updating data`);
      const existingPeer = this.peers.get(peerId);
      const updatedPeer = {
        ...existingPeer,
        ...peerData,
        rtpCapabilities: peerData.rtpCapabilities || existingPeer.rtpCapabilities,
        consumers: existingPeer.consumers || new Map(),
        producers: existingPeer.producers || new Map()
      };
      this.peers.set(peerId, updatedPeer);
      return updatedPeer;
    }

    // Create new peer data
    const peerInfo = {
      id: peerId,
      ...peerData,
      rtpCapabilities: peerData.rtpCapabilities || null,
      consumers: new Map(),
      producers: new Map(),
      joined: true
    };

    this.peers.set(peerId, peerInfo);
    console.log(`Peer ${peerId} added successfully to room ${this.id}`);
    console.log('Current peers in room:', Array.from(this.peers.keys()));
    
    return peerInfo;
  }

  getPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) {
      console.warn(`Peer ${peerId} not found in room ${this.id}`);
      console.log('Available peers:', Array.from(this.peers.keys()));
    }
    return peer;
  }

  updatePeerRtpCapabilities(peerId, rtpCapabilities) {
    console.log(`Updating RTP capabilities for peer ${peerId} in room ${this.id}`);
    
    const peer = this.getPeer(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    peer.rtpCapabilities = rtpCapabilities;
    this.peers.set(peerId, peer);
    console.log(`RTP capabilities updated for peer ${peerId}`);
    
    return peer;
  }

  async createWebRtcTransport(peerId, type) {
    console.log(`Creating ${type} transport for peer ${peerId} in room ${this.id}`);
    
    try {
      const { listenIps, initialAvailableOutgoingBitrate, maxIncomingBitrate } = config.webRtcTransport;
      
      const transport = await this.router.createWebRtcTransport({
        listenIps,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate,
      });

      // Store the transport
      if (!this.transports.has(peerId)) {
        this.transports.set(peerId, new Map());
      }
      this.transports.get(peerId).set(type, transport);

      // If consumer transport, set max bitrate
      if (type === 'consumer' && maxIncomingBitrate) {
        try {
          await transport.setMaxIncomingBitrate(maxIncomingBitrate);
        } catch (error) {
          console.error('Error setting max incoming bitrate:', error);
        }
      }

      console.log(`${type} transport created successfully for peer ${peerId}`);
      return {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };
    } catch (error) {
      console.error(`Error creating ${type} transport for peer ${peerId}:`, error);
      throw error;
    }
  }

  getTransport(peerId, type) {
    const peerTransports = this.transports.get(peerId);
    if (!peerTransports) {
      console.warn(`No transports found for peer ${peerId}`);
      return null;
    }
    const transport = peerTransports.get(type);
    if (!transport) {
      console.warn(`No ${type} transport found for peer ${peerId}`);
    }
    return transport;
  }

  removePeer(peerId) {
    // Close all associated transports
    const peerTransports = this.transports.get(peerId);
    if (peerTransports) {
      for (const transport of peerTransports.values()) {
        transport.close();
      }
    }
    this.transports.delete(peerId);

    // Close all producers
    const producersToClose = Array.from(this.producers.values())
      .filter(producer => producer.appData.peerId === peerId);
    
    for (const producer of producersToClose) {
      producer.close();
      this.producers.delete(producer.id);
      
      // Remove from type-specific maps
      if (producer.appData.kind === 'audio') {
        this.audioProducers.delete(peerId);
      } else if (producer.appData.kind === 'video') {
        this.videoProducers.delete(peerId);
      } else if (producer.appData.kind === 'screen') {
        this.screenProducers.delete(peerId);
      }
    }

    // Close all consumers
    const consumersToClose = Array.from(this.consumers.values())
      .filter(consumer => consumer.appData.peerId === peerId);
    
    for (const consumer of consumersToClose) {
      consumer.close();
      this.consumers.delete(consumer.id);
    }

    // Remove peer from map
    this.peers.delete(peerId);

    return {
      peersLeft: this.peers.size
    };
  }

  getProducerListForPeer() {
    const producerList = [];
    
    // Add audio producers
    for (const [peerId, producer] of this.audioProducers.entries()) {
      producerList.push({
        producerId: producer.id,
        peerId: peerId,
        kind: 'audio'
      });
    }
    
    // Add video producers
    for (const [peerId, producer] of this.videoProducers.entries()) {
      producerList.push({
        producerId: producer.id,
        peerId: peerId,
        kind: 'video'
      });
    }
    
    // Add screen producers
    for (const [peerId, producer] of this.screenProducers.entries()) {
      producerList.push({
        producerId: producer.id,
        peerId: peerId,
        kind: 'screen'
      });
    }
    
    return producerList;
  }

  async createProducer(peerId, transportId, rtpParameters, kind, mediaType = 'video') {
    const transport = this.getTransport(peerId, 'producer');
    
    if (!transport) {
      throw new Error(`Transport for peer ${peerId} not found`);
    }

    const producer = await transport.produce({
      kind,
      rtpParameters,
      appData: { peerId, kind: mediaType }
    });

    this.producers.set(producer.id, producer);
    
    // Store in type-specific map
    if (mediaType === 'audio') {
      this.audioProducers.set(peerId, producer);
    } else if (mediaType === 'video') {
      this.videoProducers.set(peerId, producer);
    } else if (mediaType === 'screen') {
      this.screenProducers.set(peerId, producer);
    }

    producer.on('transportclose', () => {
      console.log(`Producer ${producer.id} transport closed`);
      this.producers.delete(producer.id);
      
      if (mediaType === 'audio') {
        this.audioProducers.delete(peerId);
      } else if (mediaType === 'video') {
        this.videoProducers.delete(peerId);
      } else if (mediaType === 'screen') {
        this.screenProducers.delete(peerId);
      }
    });

    return producer.id;
  }

  async createConsumer(consumerPeerId, producerId) {
    try {
      if (!consumerPeerId) {
        throw new Error('Consumer peer ID is required');
      }

      const producer = this.producers.get(producerId);
      if (!producer) {
        throw new Error(`Producer ${producerId} not found`);
      }

      const peer = this.peers.get(consumerPeerId);
      if (!peer) {
        throw new Error(`Peer ${consumerPeerId} not found`);
      }

      if (!peer.rtpCapabilities) {
        throw new Error(`Peer ${consumerPeerId} RTP capabilities not set`);
      }

      const transport = this.getTransport(consumerPeerId, 'consumer');
      if (!transport) {
        throw new Error(`Consumer transport for peer ${consumerPeerId} not found`);
      }

      // Verify the peer can consume the producer
      if (!this.router.canConsume({
        producerId: producer.id,
        rtpCapabilities: peer.rtpCapabilities
      })) {
        throw new Error(`Peer ${consumerPeerId} cannot consume producer ${producerId}`);
      }

      console.log(`Creating consumer for peer ${consumerPeerId} from producer ${producerId}`);

      const consumer = await transport.consume({
        producerId: producer.id,
        rtpCapabilities: peer.rtpCapabilities,
        paused: true,
        appData: {
          peerId: consumerPeerId,
          producerPeerId: producer.appData.peerId
        }
      });

      // Store the consumer
      this.consumers.set(consumer.id, consumer);
      peer.consumers.set(consumer.id, consumer);

      console.log(`Consumer created successfully: ${consumer.id}`);

      // Handle consumer events
      consumer.on('transportclose', () => {
        console.log(`Consumer ${consumer.id} transport closed`);
        this.consumers.delete(consumer.id);
        peer.consumers.delete(consumer.id);
      });

      consumer.on('producerclose', () => {
        console.log(`Consumer ${consumer.id} producer closed`);
        this.consumers.delete(consumer.id);
        peer.consumers.delete(consumer.id);
      });

      return {
        id: consumer.id,
        producerId: producer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: producer.appData.kind,
        producerPeerId: producer.appData.peerId,
        paused: consumer.paused
      };
    } catch (error) {
      console.error('Error creating consumer:', error);
      throw error;
    }
  }

  async pauseProducer(peerId, mediaType) {
    let producer;
    
    if (mediaType === 'audio') {
      producer = this.audioProducers.get(peerId);
    } else if (mediaType === 'video') {
      producer = this.videoProducers.get(peerId);
    } else if (mediaType === 'screen') {
      producer = this.screenProducers.get(peerId);
    }
    
    if (!producer) {
      throw new Error(`No ${mediaType} producer found for peer ${peerId}`);
    }
    
    await producer.pause();
    return true;
  }

  async resumeProducer(peerId, mediaType) {
    let producer;
    
    if (mediaType === 'audio') {
      producer = this.audioProducers.get(peerId);
    } else if (mediaType === 'video') {
      producer = this.videoProducers.get(peerId);
    } else if (mediaType === 'screen') {
      producer = this.screenProducers.get(peerId);
    }
    
    if (!producer) {
      throw new Error(`No ${mediaType} producer found for peer ${peerId}`);
    }
    
    await producer.resume();
    return true;
  }

  async closeProducer(peerId, mediaType) {
    let producer;
    
    if (mediaType === 'audio') {
      producer = this.audioProducers.get(peerId);
      if (producer) {
        this.audioProducers.delete(peerId);
      }
    } else if (mediaType === 'video') {
      producer = this.videoProducers.get(peerId);
      if (producer) {
        this.videoProducers.delete(peerId);
      }
    } else if (mediaType === 'screen') {
      producer = this.screenProducers.get(peerId);
      if (producer) {
        this.screenProducers.delete(peerId);
      }
    }
    
    if (!producer) {
      throw new Error(`No ${mediaType} producer found for peer ${peerId}`);
    }
    
    producer.close();
    this.producers.delete(producer.id);
    
    return true;
  }

  getPeers() {
    return Array.from(this.peers.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      role: data.role
    }));
  }

  close() {
    // Close all transports
    for (const peerTransports of this.transports.values()) {
      for (const transport of peerTransports.values()) {
        transport.close();
      }
    }
    
    this.transports.clear();
    this.producers.clear();
    this.consumers.clear();
    this.audioProducers.clear();
    this.videoProducers.clear();
    this.screenProducers.clear();
    this.peers.clear();
  }
}

module.exports = Room; 