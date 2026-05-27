# PKLinks Backend

Node.js microservices backend for the PKLinks URL shortener.

## Architecture

```
Client -> API Gateway (:3000)
           |- auth-service     (:3001) - signup, login, password reset
           |- link-service     (:3002) - short-link CRUD
           |- redirect-service (:3003) - Redis-cached 302 redirects
           `- analytics-api    (:3005) - per-user analytics API

analytics-worker (no port) - RabbitMQ consumer, writes clicks to MongoDB

Infrastructure:
  MongoDB  :27017 - primary database
  Redis    :6379  - redirect cache + rate limiting
  RabbitMQ :5672  - event bus (management UI :15672)
```

## Quick Start (Docker)

```bash
cd backend
docker-compose up --build
```

Useful commands:

```bash
docker-compose up --build -d
docker-compose logs -f
docker-compose down
```

## Service Endpoints

| Service | Port | Key Routes |
|---|---:|---|
| api-gateway | 3000 | All public routes go through here |
| auth-service | 3001 | `POST /api/auth/signup`, `POST /api/auth/login` |
| link-service | 3002 | `GET/POST/PATCH/DELETE /api/links` |
| redirect-service | 3003 | `GET /r/:code` |
| analytics-api | 3005 | `GET /api/links/:code/analytics` |

## Environment Variables

Set these as needed:

- `JWT_SECRET`
- `MONGO_URI`
- `REDIS_URL`
- `RABBITMQ_URL`
- `ALLOWED_ORIGIN`
- `BASE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

Docker Compose now provides MongoDB, Redis, and RabbitMQ locally by default.

## RabbitMQ Event Flow

```
link-service     ---- link.created / link.updated / link.deleted ---> redirect-service
redirect-service ---- click.event ----------------------------------> analytics-worker
auth-service     ---- user.registered / email.send -----------------> notification-service
```

## Local Development (without Docker)

Start MongoDB, Redis, and RabbitMQ separately, then:

```bash
npm install

# Start individual services (each in its own terminal)
PORT=3001 npm run dev:auth
PORT=3002 npm run dev:link
PORT=3003 npm run dev:redirect
          npm run dev:worker
PORT=3005 npm run dev:analytics
PORT=3000 npm run dev:gateway
```
