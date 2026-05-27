FROM node:18-alpine

WORKDIR /app

COPY package.json ./
COPY packages/ ./packages/

COPY link-service/package.json ./link-service/

RUN npm install --workspace link-service --legacy-peer-deps

COPY link-service/ ./link-service/

WORKDIR /app/link-service

EXPOSE 3002

CMD ["node", "src/server.js"]
