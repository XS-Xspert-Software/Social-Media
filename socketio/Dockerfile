# Dockerfile for Socket.IO server
FROM node:20-alpine
WORKDIR /app
COPY server.js ./
RUN npm install socket.io
EXPOSE 4000
CMD ["node", "server.js"]
