# 🔗 PKLinks Platform

PKLinks is a high-performance, microservices-based URL shortener and analytics platform. It features robust user authentication, high-speed cached redirections, and asynchronous background analytics processing.

## 🏛️ Architecture Overview

The system is built on a distributed microservices architecture to ensure scalability and separation of concerns. All external traffic is routed through the **API Gateway**, which acts as a reverse proxy to the underlying services.

```mermaid
graph TD
    Client[Client Browser / Frontend]
    Gateway[API Gateway :3000]
    
    Client -->|HTTP /api, /r| Gateway
    
    subgraph Microservices
        Auth[Auth Service]
        Link[Link Service]
        Redirect[Redirect Service]
        AnalyticsAPI[Analytics API]
        AnalyticsWorker[Analytics Worker]
        Notification[Notification Service]
    end
    
    Gateway -->|/api/auth| Auth
    Gateway -->|/api/links| Link
    Gateway -->|/api/analytics| AnalyticsAPI
    Gateway -->|/r/:code| Redirect
    
    subgraph Infrastructure
        Mongo[(MongoDB)]
        Redis[(Redis Cache)]
        RabbitMQ{RabbitMQ Message Broker}
    end
    
    Auth --> Mongo
    Link --> Mongo
    AnalyticsAPI --> Mongo
    Redirect --> Redis
    Redirect --> Mongo
    
    %% Event Driven Communications
    Redirect -.->|Publish 'link.clicked'| RabbitMQ
    RabbitMQ -.->|Consume| AnalyticsWorker
    AnalyticsWorker --> Mongo
    
    Auth -.->|Publish 'email.send'| RabbitMQ
    RabbitMQ -.->|Consume| Notification
```

---

## 🔄 Core Request Flows

### 1. High-Speed Redirection & Async Analytics

When a user clicks a short link, speed is critical. The Redirect Service relies heavily on Redis caching and offloads all analytics processing to a background worker via RabbitMQ so the user never waits for database writes.

```mermaid
sequenceDiagram
    participant User as Visitor
    participant Gateway as API Gateway
    participant Redirect as Redirect Service
    participant Redis as Redis Cache
    participant DB as MongoDB
    participant RMQ as RabbitMQ
    participant Worker as Analytics Worker

    User->>Gateway: GET /r/xyz123
    Gateway->>Redirect: Route Request
    
    Redirect->>Redis: Check Cache
    alt Cache Hit
        Redis-->>Redirect: Return Target URL
    else Cache Miss
        Redirect->>DB: Find Link by Code
        DB-->>Redirect: Return Target URL
        Redirect->>Redis: Save to Cache (TTL)
    end
    
    Redirect-->>User: 302 Redirect to Target URL
    
    %% Asynchronous Processing (Fire and Forget)
    Note over Redirect,Worker: Background Analytics Processing
    Redirect-)RMQ: Publish 'link.clicked' event (IP, User-Agent, etc.)
    RMQ-)Worker: Consume event from queue
    Worker->>Worker: Parse GeoIP & Device Data
    Worker->>DB: Bulk Update Analytics (Counters & Timeseries)
```

### 2. User Authentication & Email Notifications

Email notifications (like password resets) are decoupled from the main HTTP request flow to ensure the API responds instantly even if the SMTP provider is slow.

```mermaid
sequenceDiagram
    participant User
    participant Auth as Auth Service
    participant RMQ as RabbitMQ
    participant Email as Notification Service
    participant SMTP as SMTP Server (Gmail)

    User->>Auth: POST /api/auth/forgot-password
    Auth->>Auth: Generate Reset Token
    Auth->>DB: Save Token to DB
    Auth-)RMQ: Publish 'email.send' (Template + Data)
    Auth-->>User: 200 OK (Instant Response)
    
    Note over RMQ,SMTP: Background Email Delivery
    RMQ-)Email: Consume email job
    Email->>Email: Render HTML Template
    Email->>SMTP: Send Email
    SMTP-->>Email: OK
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose

### 1. Environment Configuration
Clone `.env.example` to `.env` in both the `frontend/` and `backend/` directories, and fill in the required `<CHANGE_ME>` variables:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Run the Backend Stack (Docker)
The backend uses Docker Compose to orchestrate MongoDB, Redis, RabbitMQ, and all 7 microservices.
```bash
cd backend
docker compose up --build -d
```
*The API Gateway will now be listening on `http://localhost:3000`.*

### 3. Run the Frontend (Vite)
Open a new terminal and start the Vite React development server:
```bash
cd frontend
npm install
npm run dev
```
*The Frontend will now be listening on `http://localhost:5175`.*

---

## 🔌 Default Local Ports

| Service | Port | Description |
|---|---|---|
| **Frontend** | `5175` | React / Vite Dashboard |
| **API Gateway** | `3000` | Main entrypoint for all frontend API calls |
| **Auth Service** | `3001` | Handles Registration, Login, JWTs |
| **Link Service** | `3002` | Handles Link CRUD & short code generation |
| **Redirect Service** | `3003` | Resolves short codes to long URLs |
| **Analytics API** | `3005` | Serves dashboard metrics & charts |
| **MongoDB** | `27017` | Primary Database |
| **Redis** | `6379` | High-speed Caching |
| **RabbitMQ UI** | `15672` | Message Broker Dashboard (guest / guest) |
