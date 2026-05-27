FROM node:18-alpine

WORKDIR /app

COPY package.json ./
COPY packages/ ./packages/

COPY analytics-worker/package.json ./analytics-worker/

RUN npm install --workspace analytics-worker --legacy-peer-deps

COPY analytics-worker/ ./analytics-worker/

WORKDIR /app/analytics-worker

# No EXPOSE — this is a worker, no HTTP port
CMD ["node", "src/worker.js"]
