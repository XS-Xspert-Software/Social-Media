# Simple Dockerfile for WebSocket/Socket.IO hybrid server
FROM node:20-alpine
WORKDIR /app

# Copy only package descriptors first for better layer caching
COPY package.json ./

# Install production dependencies
RUN npm install --only=production

# Now copy the rest of the source
COPY . .

EXPOSE 4000
CMD ["node", "server.js"]
