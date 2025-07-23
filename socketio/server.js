// Minimal Socket.IO server for global chat (serverless style)
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const PORT = process.env.PORT || 4000;
const server = createServer();
const io = new SocketIOServer(server, { cors: { origin: '*' } });

let globalMessages = [];
// Clean up messages older than 24 hours every minute
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  globalMessages = globalMessages.filter(msg => new Date(msg.timestamp).getTime() > cutoff);
}, 60 * 1000);

io.on('connection', (socket) => {
  console.log('[Socket.IO] New client connected:', socket.id);
  socket.emit('global-messages', globalMessages);
  socket.on('global-message', (msg) => {
    console.log('[Socket.IO] Received global-message:', msg);
    globalMessages.push(msg);
    io.emit('global-message', msg);
  });
  socket.on('disconnect', () => {
    console.log('[Socket.IO] Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`);
});
