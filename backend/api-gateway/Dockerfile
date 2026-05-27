FROM node:18-alpine

WORKDIR /app

COPY package.json ./
COPY packages/ ./packages/

COPY api-gateway/package.json ./api-gateway/

RUN npm install --workspace api-gateway --legacy-peer-deps

COPY api-gateway/ ./api-gateway/

WORKDIR /app/api-gateway

EXPOSE 3000

CMD ["node", "src/index.js"]
