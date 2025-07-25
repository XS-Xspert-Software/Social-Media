// Minimal Socket.IO server for global chat (serverless style)
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import pkg from 'pg';

const { Pool } = pkg;

const PORT = process.env.PORT || 4000;
const server = createServer();
const io = new SocketIOServer(server, { cors: { origin: '*' } });

// PostgreSQL connection pool
const pool = new Pool({
  user: 'socketio',
  host: 'mnz.domcloud.co',
  database: 'socketio_msg',
  password: "zK2(j6)Mn6sOzL)87W",
  port: 5432,
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

io.on('connection', async (socket) => {
  console.log('[Socket.IO] New client connected:', socket.id);
  // Send recent messages from DB
  try {
    const recentMessages = await fetchRecentMessages();
    // Parse content JSON for each message
    socket.emit('global-messages', recentMessages.map(row => JSON.parse(row.content)));
  } catch (err) {
    console.error('Error fetching messages:', err);
    socket.emit('global-messages', []);
  }
  socket.on('global-message', async (msg) => {
    console.log('[Socket.IO] Received global-message:', msg);
    // Ensure timestamp is set and valid
    if (!msg.timestamp) {
      msg.timestamp = new Date().toISOString(); // fallback to server time
    }
    try {
      await insertMessage(msg);
      io.emit('global-message', msg);
    } catch (err) {
      console.error('Error inserting message:', err);
    }
  });
  socket.on('disconnect', () => {
    console.log('[Socket.IO] Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`);
});
