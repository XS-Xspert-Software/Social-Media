// Legacy support for Socket.IO (now replaced with WebSocket) coded by Viktor Konkov
// Original code by Viktor Konkov
// WebSocket server for global chat (replacing Socket.IO)
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import pkg from 'pg';
import { Server as SocketIOServer } from 'socket.io'; // Add Socket.IO import

const { Pool } = pkg;

const PORT = process.env.PORT || 4000;
const server = createServer();
const wss = new WebSocketServer({ server });

// Legacy Socket.IO fallback support
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Allow all origins for legacy clients
  },
  path: '/socket.io', // Default path
});

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  ssl: { rejectUnauthorized: false }, // for cloud hosting
});

// Helper: fetch messages from last 24 hours
async function fetchRecentMessages() {
  try {
    const res = await pool.query(
      `SELECT * FROM messages WHERE timestamp > NOW() - INTERVAL '24 hours' ORDER BY timestamp ASC`
    );
    // Logging how many messages were fetched for transparency
    console.log(`[DB] fetchRecentMessages: fetched ${res.rows.length} messages from the last 24 hours`);
    return res.rows;
  } catch (err) {
    // Log DB errors in fetching messages
    console.error('[DB] fetchRecentMessages ERROR:', err);
    return [];
  }
}

// Helper: insert a new message
async function insertMessage(msg) {
  try {
    await pool.query(
      `INSERT INTO messages (content, timestamp) VALUES ($1, $2)`,
      [JSON.stringify(msg), msg.timestamp]
    );
    // Log successful message insert with timestamp and content preview
    console.log(`[DB] insertMessage: inserted message at ${msg.timestamp} | content: ${msg.content?.slice?.(0, 30) || JSON.stringify(msg).slice(0, 30)}...`);
  } catch (err) {
    // Log DB errors in inserting messages
    console.error('[DB] insertMessage ERROR:', err);
  }
}

// Helper: delete old messages
async function deleteOldMessages() {
  try {
    const res = await pool.query(
      `DELETE FROM messages WHERE timestamp <= NOW() - INTERVAL '24 hours'`
    );
    // Log cleanup event
    console.log('[DB] deleteOldMessages: cleaned up messages older than 24 hours');
  } catch (err) {
    // Log DB errors in deleting old messages
    console.error('[DB] deleteOldMessages ERROR:', err);
  }
}

// Clean up messages older than 24 hours every minute
setInterval(deleteOldMessages, 60 * 1000);

function safeSend(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', async (ws, req) => {
  const clientId = Math.random().toString(36).slice(2);
  // Log new WebSocket connection with clientId and IP
  console.log(`[WS] New client connected: ${clientId} from ${req.socket.remoteAddress}`);

  // Send recent messages from DB
  try {
    const recentMessages = await fetchRecentMessages();
    safeSend(ws, { type: 'global-messages', data: recentMessages.map((row) => JSON.parse(row.content)) });
    // Log successful delivery of recent messages
    console.log(`[WS] Sent ${recentMessages.length} recent messages to client ${clientId}`);
  } catch (err) {
    // Log error and fallback to empty message list
    console.error(`[WS] Error fetching messages for client ${clientId}:`, err);
    safeSend(ws, { type: 'global-messages', data: [] });
  }

  ws.on('message', async (raw) => {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(raw.toString('utf8'));
      const { type, data } = parsed || {};

      if (type === 'global-message' && data) {
        const msg = { ...data };
        if (!msg.timestamp) {
          msg.timestamp = new Date().toISOString();
        }
        // Log incoming message event
        console.log(`[WS] Received global-message from client ${clientId}:`, msg);
        try {
          await insertMessage(msg);
          broadcast({ type: 'global-message', data: msg });
          // Log broadcast event
          console.log(`[WS] Broadcasted global-message from client ${clientId}`);
        } catch (err) {
          // Log error in message insertion/broadcast
          console.error(`[WS] Error inserting/broadcasting message from client ${clientId}:`, err);
        }
      }
    } catch (e) {
      // Log parsing errors for incoming messages
      console.warn(`[WS] Failed to parse incoming message from client ${clientId}:`, e);
    }
  });

  ws.on('close', () => {
    // Log client disconnect event
    console.log(`[WS] Client disconnected: ${clientId}`);
  });
});

// Legacy Socket.IO global chat support
io.on('connection', async (socket) => {
  const clientId = Math.random().toString(36).slice(2);
  // Log new Socket.IO connection
  console.log(`[Socket.IO] New client connected: ${clientId}`);

  // Send recent messages from DB
  try {
    const recentMessages = await fetchRecentMessages();
    socket.emit('global-messages', recentMessages.map((row) => JSON.parse(row.content)));
    // Log successful delivery of recent messages
    console.log(`[Socket.IO] Sent ${recentMessages.length} recent messages to client ${clientId}`);
  } catch (err) {
    // Log error and fallback to empty message list
    console.error(`[Socket.IO] Error fetching messages for client ${clientId}:`, err);
    socket.emit('global-messages', []);
  }

  socket.on('global-message', async (data) => {
    const msg = { ...data };
    if (!msg.timestamp) {
      msg.timestamp = new Date().toISOString();
    }
    // Log incoming message event
    console.log(`[Socket.IO] Received global-message from client ${clientId}:`, msg);
    try {
      await insertMessage(msg);
      // Broadcast to all Socket.IO clients
      io.emit('global-message', msg);
      // Also broadcast to WebSocket clients for consistency
      broadcast({ type: 'global-message', data: msg });
      // Log broadcast event
      console.log(`[Socket.IO] Broadcasted global-message from client ${clientId}`);
    } catch (err) {
      // Log error in message insertion/broadcast
      console.error(`[Socket.IO] Error inserting/broadcasting message from client ${clientId}:`, err);
    }
  });

  socket.on('disconnect', () => {
    // Log client disconnect event
    console.log(`[Socket.IO] Client disconnected: ${clientId}`);
  });
});

server.listen(PORT, () => {
  // Log server startup
  console.log(`[WS] Server running on port ${PORT}`);
});
