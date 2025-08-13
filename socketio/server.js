// WebSocket server for global chat (replacing Socket.IO)
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import pkg from 'pg';

const { Pool } = pkg;

const PORT = process.env.PORT || 4000;
const server = createServer();
const wss = new WebSocketServer({ server });

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
  const res = await pool.query(
    `SELECT * FROM messages WHERE timestamp > NOW() - INTERVAL '24 hours' ORDER BY timestamp ASC`
  );
  console.log(`[DB] fetchRecentMessages: fetched ${res.rows.length} messages`);
  return res.rows;
}

// Helper: insert a new message
async function insertMessage(msg) {
  try {
    await pool.query(
      `INSERT INTO messages (content, timestamp) VALUES ($1, $2)`,
      [JSON.stringify(msg), msg.timestamp]
    );
    console.log(`[DB] insertMessage: inserted message with timestamp ${msg.timestamp}`);
  } catch (err) {
    console.error('[DB] insertMessage ERROR:', err);
  }
}

// Helper: delete old messages
async function deleteOldMessages() {
  await pool.query(
    `DELETE FROM messages WHERE timestamp <= NOW() - INTERVAL '24 hours'`
  );
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
  console.log('[WS] New client connected:', clientId, 'from', req.socket.remoteAddress);

  // Send recent messages from DB
  try {
    const recentMessages = await fetchRecentMessages();
    safeSend(ws, { type: 'global-messages', data: recentMessages.map((row) => JSON.parse(row.content)) });
  } catch (err) {
    console.error('Error fetching messages:', err);
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
        console.log('[WS] Received global-message:', msg);
        try {
          await insertMessage(msg);
          broadcast({ type: 'global-message', data: msg });
        } catch (err) {
          console.error('Error inserting message:', err);
        }
      }
    } catch (e) {
      console.warn('[WS] Failed to parse incoming message:', e);
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected:', clientId);
  });
});

server.listen(PORT, () => {
  console.log(`[WS] Server running on port ${PORT}`);
});
