# PKLinks Flow

## Architecture Diagram

```mermaid
flowchart LR
  U[User / Browser] --> F[React Frontend]
  F --> G[API Gateway]
  G --> A[auth-service]
  G --> L[link-service]
  G --> R[redirect-service]
  G --> Q[analytics-api]

  R --> C[(Redis Cache)]
  R --> M[(MongoDB)]
  R --> B[(RabbitMQ)]
  L --> M
  A --> M
  Q --> M
  W[analytics-worker] --> B
  W --> M
  N[notification-service] --> B
```

## Link Creation Flow

```mermaid
sequenceDiagram
  participant U as User
  participant F as Frontend
  participant G as API Gateway
  participant L as Link Service
  participant M as MongoDB

  U->>F: Create short link
  F->>G: POST /api/links
  G->>L: Forward request
  L->>M: Save link
  M-->>L: Created link
  L-->>G: Response
  G-->>F: Link created
```

## Redirect and Analytics Flow

```mermaid
sequenceDiagram
  participant U as User
  participant G as API Gateway
  participant R as Redirect Service
  participant C as Redis
  participant M as MongoDB
  participant B as RabbitMQ
  participant W as Analytics Worker

  U->>G: GET /r/:code
  G->>R: Forward redirect request
  R->>C: Check cached target
  alt Cache hit
    C-->>R: Target URL
  else Cache miss
    R->>M: Look up code
    M-->>R: Target URL
    R->>C: Cache target
  end
  R->>B: Publish click event
  R-->>U: HTTP redirect
  W->>B: Consume click event
  W->>M: Store click analytics
```

## Auth Flow

- User opens login or signup page
- Frontend sends auth request to gateway
- Gateway proxies request to `auth-service`
- Auth service validates user data in MongoDB
- JWT/auth state is returned to frontend

## Analytics Read Flow

- User opens analytics page for a link
- Frontend requests `/api/links/:code/analytics`
- Gateway forwards to `analytics-api`
- Analytics API reads aggregated analytics data from MongoDB
- Response returns to frontend dashboard

## Frontend Route Flow

- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/dashboard`
- `/dashboard/links`
- `/dashboard/links/:code`
- `/dashboard/links/:code/analytics`
- `/r/:code`

## Service Responsibility Summary

- Gateway: external routing, shared middleware, auth-aware forwarding
- Auth service: identity and credential workflows
- Link service: write-side link operations
- Redirect service: low-latency link resolution
- Analytics API: read-side analytics queries
- Analytics worker: background event processing
- Notification service: event-driven notifications

## Operational Notes

- Redis matters most for redirect speed
- RabbitMQ matters most for non-blocking analytics/event flow
- MongoDB remains the primary source of persistent truth
- Gateway is the main backend surface for browser clients
