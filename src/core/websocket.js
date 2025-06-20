'use strict';
const crypto = require('crypto');
const log = require('./logger');

// WebSocket magic string as per RFC 6455
const WS_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// WebSocket opcodes
const OPCODES = {
  CONTINUATION: 0x0,
  TEXT: 0x1,
  BINARY: 0x2,
  CLOSE: 0x8,
  PING: 0x9,
  PONG: 0xa
};

// Connected clients grouped by location
const clients = new Map(); // locationId -> Set of WebSocket connections

class WebSocketConnection {
  constructor(socket, locationId = null) {
    this.socket = socket;
    this.locationId = locationId;
    this.isAlive = true;
    
    // Add to clients list
    if (locationId) {
      if (!clients.has(locationId)) {
        clients.set(locationId, new Set());
      }
      clients.get(locationId).add(this);
    }
    
    // Handle socket events
    this.socket.on('close', () => {
      this.cleanup();
    });
    
    this.socket.on('error', (error) => {
      log.error(`WebSocket error: ${error.message}`);
      this.cleanup();
    });
    
    this.socket.on('data', (buffer) => {
      try {
        this.handleFrame(buffer);
      } catch (error) {
        log.error(`WebSocket frame handling error: ${error.message}`);
        this.close();
      }
    });
    
    log.debug(`WebSocket connection established for location ${locationId || 'global'}`);
  }
  
  cleanup() {
    this.isAlive = false;
    if (this.locationId && clients.has(this.locationId)) {
      clients.get(this.locationId).delete(this);
      if (clients.get(this.locationId).size === 0) {
        clients.delete(this.locationId);
      }
    }
    log.debug(`WebSocket connection cleaned up for location ${this.locationId || 'global'}`);
  }
  
  handleFrame(buffer) {
    if (buffer.length < 2) return;
    
    const firstByte = buffer[0];
    const secondByte = buffer[1];
    
    const fin = (firstByte & 0x80) === 0x80;
    const opcode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) === 0x80;
    let payloadLength = secondByte & 0x7f;
    
    let offset = 2;
    
    // Extended payload length
    if (payloadLength === 126) {
      payloadLength = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      // For simplicity, we don't handle 64-bit lengths
      payloadLength = buffer.readUInt32BE(offset + 4);
      offset += 8;
    }
    
    // Masking key (if present)
    let maskingKey = null;
    if (masked) {
      maskingKey = buffer.slice(offset, offset + 4);
      offset += 4;
    }
    
    // Payload
    const payload = buffer.slice(offset, offset + payloadLength);
    
    // Unmask payload if needed
    if (masked && maskingKey) {
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= maskingKey[i % 4];
      }
    }
    
    // Handle different opcodes
    switch (opcode) {
      case OPCODES.TEXT:
        const message = payload.toString('utf8');
        log.debug(`WebSocket received text: ${message}`);
        this.handleMessage(message);
        break;
        
      case OPCODES.PING:
        this.pong(payload);
        break;
        
      case OPCODES.CLOSE:
        this.close();
        break;
        
      default:
        log.debug(`WebSocket received opcode ${opcode}`);
    }
  }
  
  handleMessage(message) {
    try {
      const data = JSON.parse(message);
      
      // Handle different message types
      switch (data.type) {
        case 'subscribe':
          if (data.locationId) {
            this.setLocation(data.locationId);
          }
          break;
          
        case 'ping':
          this.send({ type: 'pong', timestamp: Date.now() });
          break;
          
        default:
          log.debug(`Unknown WebSocket message type: ${data.type}`);
      }
    } catch (error) {
      log.error(`WebSocket message parsing error: ${error.message}`);
    }
  }
  
  setLocation(locationId) {
    // Remove from old location
    if (this.locationId && clients.has(this.locationId)) {
      clients.get(this.locationId).delete(this);
    }
    
    // Add to new location
    this.locationId = locationId;
    if (!clients.has(locationId)) {
      clients.set(locationId, new Set());
    }
    clients.get(locationId).add(this);
    
    log.debug(`WebSocket client subscribed to location ${locationId}`);
  }
  
  send(data) {
    if (!this.isAlive) return false;
    
    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      const frame = this.createFrame(message, OPCODES.TEXT);
      this.socket.write(frame);
      return true;
    } catch (error) {
      log.error(`WebSocket send error: ${error.message}`);
      return false;
    }
  }
  
  ping(data = Buffer.alloc(0)) {
    if (!this.isAlive) return false;
    
    try {
      const frame = this.createFrame(data, OPCODES.PING);
      this.socket.write(frame);
      return true;
    } catch (error) {
      log.error(`WebSocket ping error: ${error.message}`);
      return false;
    }
  }
  
  pong(data = Buffer.alloc(0)) {
    if (!this.isAlive) return false;
    
    try {
      const frame = this.createFrame(data, OPCODES.PONG);
      this.socket.write(frame);
      return true;
    } catch (error) {
      log.error(`WebSocket pong error: ${error.message}`);
      return false;
    }
  }
  
  close() {
    if (!this.isAlive) return;
    
    try {
      const frame = this.createFrame(Buffer.alloc(0), OPCODES.CLOSE);
      this.socket.write(frame);
      this.socket.end();
    } catch (error) {
      log.error(`WebSocket close error: ${error.message}`);
    }
    
    this.cleanup();
  }
  
  createFrame(data, opcode = OPCODES.TEXT) {
    const payload = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const payloadLength = payload.length;
    
    let frame;
    let offset = 0;
    
    // Determine frame size
    if (payloadLength < 126) {
      frame = Buffer.allocUnsafe(2 + payloadLength);
      frame[1] = payloadLength;
      offset = 2;
    } else if (payloadLength < 65536) {
      frame = Buffer.allocUnsafe(4 + payloadLength);
      frame[1] = 126;
      frame.writeUInt16BE(payloadLength, 2);
      offset = 4;
    } else {
      frame = Buffer.allocUnsafe(10 + payloadLength);
      frame[1] = 127;
      frame.writeUInt32BE(0, 2); // High 32 bits
      frame.writeUInt32BE(payloadLength, 6); // Low 32 bits
      offset = 10;
    }
    
    // First byte: FIN (1) + RSV (000) + Opcode (4 bits)
    frame[0] = 0x80 | opcode;
    
    // Copy payload
    payload.copy(frame, offset);
    
    return frame;
  }
}

// WebSocket handshake
function performHandshake(request, socket, head) {
  const key = request.headers['sec-websocket-key'];
  if (!key) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    return null;
  }
  
  // Generate accept key
  const acceptKey = crypto
    .createHash('sha1')
    .update(key + WS_MAGIC_STRING)
    .digest('base64');
  
  // Send handshake response
  const responseHeaders = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    '', ''
  ].join('\r\n');
  
  socket.write(responseHeaders);
  
  // Extract location ID from URL if present
  const url = new URL(request.url, `http://${request.headers.host}`);
  const locationId = url.searchParams.get('location');
  
  // Create WebSocket connection
  const wsConnection = new WebSocketConnection(socket, locationId);
  
  log.info(`WebSocket handshake completed for location ${locationId || 'global'}`);
  return wsConnection;
}

// Broadcast to all clients in a location
function broadcastToLocation(locationId, data) {
  if (!clients.has(locationId)) {
    return 0;
  }
  
  const locationClients = clients.get(locationId);
  let sentCount = 0;
  
  for (const client of locationClients) {
    if (client.send(data)) {
      sentCount++;
    }
  }
  
  log.debug(`Broadcasted to ${sentCount}/${locationClients.size} clients in location ${locationId}`);
  return sentCount;
}

// Broadcast to all clients
function broadcastToAll(data) {
  let totalSent = 0;
  
  for (const [locationId, locationClients] of clients) {
    for (const client of locationClients) {
      if (client.send(data)) {
        totalSent++;
      }
    }
  }
  
  log.debug(`Broadcasted to ${totalSent} total clients`);
  return totalSent;
}

// Get client statistics
function getStats() {
  const stats = {
    totalClients: 0,
    locationClients: {}
  };
  
  for (const [locationId, locationClients] of clients) {
    stats.locationClients[locationId] = locationClients.size;
    stats.totalClients += locationClients.size;
  }
  
  return stats;
}

// Cleanup inactive clients
function cleanup() {
  for (const [locationId, locationClients] of clients) {
    for (const client of locationClients) {
      if (!client.isAlive) {
        client.cleanup();
      }
    }
  }
}

// Periodic cleanup
setInterval(cleanup, 30000); // Every 30 seconds

module.exports = {
  performHandshake,
  broadcastToLocation,
  broadcastToAll,
  getStats,
  OPCODES
}; 