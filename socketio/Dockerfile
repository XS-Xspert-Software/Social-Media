# Simple Dockerfile for WebSocket server
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f package-lock.json ]; then npm ci --only=production; \
    elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm i --prod; \
    elif [ -f yarn.lock ]; then yarn install --production; \
    else npm install --only=production; fi
COPY . .
EXPOSE 4000
CMD ["node", "server.js"]
