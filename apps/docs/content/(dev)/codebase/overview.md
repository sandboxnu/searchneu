---
title: Overview
description: Codebase overview
---

## Codebase Structure

SearchNEU is organized as a monorepo using **pnpm workspaces** and **Turborepo**. This means all applications and shared packages live together in a single repository, making it easy to share code and manage dependencies.

### Repository Layout

```
search2/
├── apps/           # User-facing applications
├── packages/       # Shared internal packages
└── compose.yaml    # Local development database setup
```

## Applications

Applications are found in the `apps/` directory. These are the user-facing parts of the project.

### searchneu

**Location:** `apps/searchneu/`

The main web application for SearchNEU. This is what students see when they visit searchneu.com.

- **Framework:** Next.js 16 (React 19)
- **Purpose:** Course search, scheduling, and notifications for Northeastern University
- **Key Features:**
  - User authentication (Google OAuth via Arctic)
  - SMS notifications (via Twilio)
  - Real-time course availability tracking
  - Feature flags for gradual rollouts
  - Analytics and monitoring (Vercel Analytics, OpenTelemetry)

**Dependencies:** Uses `@sneu/db` for database access and `@sneu/scraper` for course data types.

### docs

**Location:** `apps/docs/`

The documentation website you're reading right now.

- **Framework:** Next.js 16 with Fumadocs
- **Purpose:** Developer documentation, API references, and guides
- **Port:** Runs on port 3001 during development (searchneu runs on 3000)
- **Features:**
  - MDX-based documentation
  - OpenAPI documentation support
  - Code syntax highlighting with Shiki
  - TypeScript type previews with Twoslash

## Packages

Shared packages live in the `packages/` directory. These are internal libraries used by the applications.

### @sneu/db

**Location:** `packages/db/`

Database schema and client setup.

- **ORM:** Drizzle ORM
- **Database:** PostgreSQL (via Neon serverless in production, local postgres in development)
- **Purpose:** Centralized database schema and connection management
- **Exports:**
  - `/neon` - Serverless database client for production
  - `/pg` - Standard PostgreSQL client for local development
  - `/schema` - Database schema definitions and types

**Scripts:**

- `db:generate` - Generate database migrations
- `db:migrate` - Apply migrations to database
- `db:push` - Push schema changes directly (development only)
- `db:studio` - Open Drizzle Studio UI for database inspection

### @sneu/scraper

**Location:** `packages/scraper/`

Course data scraper and updater.

- **Purpose:** Fetch course data from Northeastern's systems and keep it up to date
- **Exports:**
  - `/types` - TypeScript types for course data
  - `/update` - Course data update logic
  - `/notifs` - Notification generation when courses change

**Scripts:**

- `scrape:gen` - Generate/fetch fresh course data
- `scrape:up` - Upload scraped data to the database

### @sneu/notifs

**Location:** `packages/notifs/`

Notification delivery system.

- **Purpose:** Send SMS notifications to users via Twilio
- **Dependencies:** Twilio SDK
- **Use Case:** Alert students when course seats become available

### @sneu/tsconfig

**Location:** `packages/tsconfig/`

Shared TypeScript configuration.

- **Purpose:** Common TypeScript settings used across all packages and apps
- **Pattern:** Extend this config in each package's `tsconfig.json` for consistency

## Tooling

### Monorepo Management

**pnpm workspaces** - Package manager and workspace management

- All packages defined in `pnpm-workspace.yaml`
- Enables `workspace:*` protocol for internal dependencies
- Single `node_modules` with package linking

**Turborepo** - Build orchestration and caching

- Configuration in `turbo.json`
- Handles task dependencies (e.g., build packages before apps)
- Caches build outputs for faster rebuilds
- TUI (Terminal UI) mode for better visibility during development

### Key Scripts

Run these from the repository root:

**Development:**

```bash
pnpm dev          # Start all apps in development mode
```

**Building:**

```bash
pnpm build        # Build all apps and packages
```

**Database:**

```bash
pnpm db:generate  # Generate database migrations
pnpm db:migrate   # Apply migrations
pnpm db:push      # Push schema changes (dev only)
pnpm db:studio    # Open database UI
```

### Local Development Environment

**Docker Compose** (`compose.yaml`) provides:

- **postgres** - ParadeDB (PostgreSQL with full-text search extensions)
- **neon-proxy** - Local proxy that mimics Neon's serverless HTTP interface

This allows you to develop locally with the same database interface used in production.

### Technology Stack

**Frontend:**

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- TypeScript 5

**Backend/Database:**

- PostgreSQL with ParadeDB
- Drizzle ORM
- Neon serverless (production)

**Development Tools:**

- pnpm for package management
- Turborepo for builds
- ESLint for linting
- Prettier for code formatting
- Docker Compose for local services

**External Services:**

- Vercel (hosting)
- Twilio (SMS)
- Google OAuth (authentication)

## Architecture

The codebase follows a monorepo architecture where:

1. **Apps** consume packages but don't export anything
2. **Packages** are built first (via `turbo.json` dependencies)
3. **Shared code** lives in packages to avoid duplication
4. **Type safety** flows from packages → apps via TypeScript

This structure makes it easy to:

- Share database schema between scraper and web app
- Reuse notification logic
- Keep TypeScript configs consistent
- Build and deploy efficiently with caching
