FROM node:18-alpine

WORKDIR /app

COPY package.json ./
COPY packages/ ./packages/

COPY notification-service/package.json ./notification-service/

RUN npm install --workspace notification-service --legacy-peer-deps

COPY notification-service/ ./notification-service/

WORKDIR /app/notification-service

# No EXPOSE — this is a worker, no HTTP port
CMD ["node", "src/index.js"]
