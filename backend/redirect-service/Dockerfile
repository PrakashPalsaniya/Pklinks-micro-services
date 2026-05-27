FROM node:18-alpine

WORKDIR /app

COPY package.json ./
COPY packages/ ./packages/

COPY redirect-service/package.json ./redirect-service/

RUN npm install --workspace redirect-service --legacy-peer-deps

COPY redirect-service/ ./redirect-service/

WORKDIR /app/redirect-service

EXPOSE 3003

CMD ["node", "src/server.js"]
