FROM node:18-alpine

WORKDIR /app

COPY package.json ./
COPY packages/ ./packages/

COPY analytics-api/package.json ./analytics-api/

RUN npm install --workspace analytics-api --legacy-peer-deps

COPY analytics-api/ ./analytics-api/

WORKDIR /app/analytics-api

EXPOSE 3005

CMD ["node", "src/server.js"]
