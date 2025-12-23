# WireMock JP

A Japanese GUI client for WireMock with centralized management support for distributed WireMock environments.

## Features

### Distributed WireMock Support
- **Bulk sync to multiple instances**: Deploy stubs to all WireMock instances with a single click
- **Health check**: Monitor connection status of each instance in real-time
- **Project-based management**: Organize stubs by environment (dev/staging/production)

### Data Persistence
- **PostgreSQL stub storage**: Data persists even after WireMock restarts
- **Team sharing**: Share the same stubs across your team via shared database

### Ease of Use
- **Japanese UI**: Switch between Japanese and English
- **Intuitive interface**: Modern UI powered by Element Plus
- **No authentication required**: Simple setup for team-wide access

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        WireMock JP                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │ -> │   Backend    │ -> │  PostgreSQL  │      │
│  │   (Vue 3)    │    │  (Fastify)   │    │ (Persistence)│      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Sync
                              ▼
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
   ┌──────────┐         ┌──────────┐         ┌──────────┐
   │ WireMock │         │ WireMock │         │ WireMock │
   │ Instance │         │ Instance │         │ Instance │
   │    #1    │         │    #2    │         │    #3    │
   └──────────┘         └──────────┘         └──────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 + TypeScript + Element Plus |
| Backend | Node.js + Fastify + Prisma |
| Database | PostgreSQL |
| Build | Vite + pnpm workspace |

## Setup

### Prerequisites
- Node.js 20.19+ or 22.12+
- PostgreSQL
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm run db:generate

# Start development server
pnpm run dev
```

### Environment Variables

```bash
# packages/backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/wiremock_jp"
```

## Usage

### 1. Create a Project
A project represents an environment (dev/staging/etc.).
Set the load balancer URL as the WireMock URL.

### 2. Add Instances
Register each WireMock server URL.
Use health check to verify connection status.

### 3. Create Stubs
Create stub mappings in the Stub Mappings screen.
Stubs are saved to PostgreSQL.

### 4. Sync
Click "Sync All Instances" to deploy stubs to all WireMock instances at once.

## License

MIT
