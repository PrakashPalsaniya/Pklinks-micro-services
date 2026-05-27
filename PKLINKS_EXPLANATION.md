# PKLinks Explanation

## Overview

PKLinks is a microservices-based URL shortener platform. It lets users sign up, create and manage short links, resolve short codes through a redirect service, and inspect analytics for those links.

This project is strong because it is intentionally split into services instead of putting everything into one backend. It demonstrates routing through an API gateway, caching with Redis, event-driven processing with RabbitMQ, and analytics processing through a worker.

## Main Goals

- Authenticate users
- Create and manage short links
- Resolve short codes quickly
- Track click activity asynchronously
- Show per-link analytics
- Keep services loosely coupled

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- TanStack Query
- Tailwind-based component styling

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- Redis
- RabbitMQ
- JWT authentication
- `http-proxy-middleware`

### Architecture Style

- API Gateway pattern
- Microservices
- Event-driven analytics pipeline
- Shared config/util packages inside backend workspace

## Service Breakdown

### `api-gateway`

- Public backend entrypoint
- Applies middleware, security headers, and proxy routing
- Forwards requests to internal services

### `auth-service`

- Signup
- Login
- Password reset flow
- Auth token logic

### `link-service`

- Link CRUD
- Ownership-aware link operations
- Publishes link lifecycle events when needed

### `redirect-service`

- Handles `/r/:code`
- Checks Redis first
- Falls back to MongoDB if needed
- Emits click events to RabbitMQ

### `analytics-api`

- Read-only analytics endpoints
- Returns analytics for authorized link owners

### `analytics-worker`

- Consumes click events from RabbitMQ
- Writes analytics records/aggregates into MongoDB

### `notification-service`

- Handles event-driven notification/email tasks

### `packages/config` and `packages/utils`

- Shared env loading
- Shared Mongo, Redis, RabbitMQ, and logger helpers

## Frontend Structure

- Auth pages: login, signup, forgot password, reset password
- Dashboard shell
- Links listing/details
- Analytics pages
- Redirect page

The frontend is a dashboard client, while the redirect route `/r/:code` is also exposed for short-link resolution flows.

## Important Behaviors

### Gateway Routing

- Frontend mostly talks to the gateway
- Gateway then proxies requests to the correct internal service
- This reduces frontend coupling to individual services

### Fast Redirect Path

- Redirect requests should be fast
- Redis is used to reduce repeated DB hits for popular codes
- If Redis misses, the service checks MongoDB and can repopulate cache

### Async Analytics

- Redirect response should stay lightweight
- Click tracking is pushed into RabbitMQ
- Worker processes the click event later

### Separation of Reads and Writes

- Link CRUD is handled by `link-service`
- Analytics reads are handled by `analytics-api`
- Redirect traffic is handled by `redirect-service`

This separation makes scaling clearer.

## Deployment-Relevant Notes

- Backend stack expects MongoDB, Redis, and RabbitMQ
- Gateway is the main externally exposed backend service
- Frontend dev server proxies `/api` and `/r` to the gateway
- Service-specific `.env` files now exist alongside the shared backend env

## Why This Project Is Strong

- Clear microservice boundaries
- Real gateway + worker + cache + message broker architecture
- Good example for system design discussion
- Better than a simple monolith for explaining scaling and responsibilities
