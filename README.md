# PKLinks Platform

PKLinks is a microservices-based URL shortener with:

- `frontend/`: React + Vite dashboard
- `backend/api-gateway/`: public API entrypoint
- `backend/auth-service/`: auth and password reset
- `backend/link-service/`: link CRUD
- `backend/redirect-service/`: redirect resolution and click publishing
- `backend/analytics-api/`: analytics reads
- `backend/analytics-worker/`: async click processing
- `backend/packages/`: shared config and utility packages

## Request Flow

- `POST /api/links` -> gateway -> link-service
- `GET /api/links` -> gateway -> link-service
- `GET /api/links/:code/analytics` -> gateway -> analytics-api
- `GET /r/:code` -> gateway -> redirect-service
- redirect-service -> Redis cache -> Mongo fallback -> RabbitMQ event
- analytics-worker -> Mongo click records and rollups

## Local Setup

1. Install frontend dependencies from the project root: `npm install`
2. Install backend dependencies: `cd backend && npm install`
3. Start backend services from `backend/`: `docker-compose up --build`
4. Start the frontend from the project root: `npm run dev`

Default local ports:

- frontend: `5175`
- gateway: `3000`
- auth-service: `3001`
- link-service: `3002`
- redirect-service: `3003`
- analytics-api: `3005`

## Docker

The backend Docker stack includes:

- `mongo`
- `redis`
- `rabbitmq`
- `auth-service`
- `link-service`
- `redirect-service`
- `analytics-api`
- `analytics-worker`
- `notification-service`
- `api-gateway`

Run it with:

```bash
cd backend
docker compose up --build
```

Useful commands:

```bash
cd backend
docker compose logs -f
docker compose down
```

Published ports:

- gateway: `http://localhost:3000`
- mongo: `localhost:27017`
- redis: `localhost:6379`
- rabbitmq UI: `http://localhost:15672`

## Environment Variables

Backend services use standard env values such as:

- `MONGO_URI`
- `REDIS_URL`
- `RABBITMQ_URL`
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `ALLOWED_ORIGIN`
- `BASE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

Frontend uses:

- `VITE_API_BASE_URL`

## Notes

- The frontend proxies `/api` and `/r` to the gateway during local development.
- Analytics access is restricted to the owner of the link.
- Password reset no longer reveals whether an email exists.
- Country analytics currently default to `Unknown` until a maintained enrichment provider is added.
