FROM node:18-alpine

WORKDIR /app

# Copy workspace root so npm workspaces can resolve shared packages
COPY package.json ./
COPY packages/ ./packages/

# Copy this service
COPY auth-service/package.json ./auth-service/

RUN npm install --workspace auth-service --legacy-peer-deps

COPY auth-service/ ./auth-service/

WORKDIR /app/auth-service

EXPOSE 3001

CMD ["node", "src/server.js"]
