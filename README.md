# TreY Compliance Execution System

TreY is a system of record for compliance execution. It enforces immutability, ownership accountability, and full auditability for obligations, SLA timelines, and evidence uploads.

## Core Principles

1. Every obligation has exactly one owner.
2. Every obligation has a fixed SLA.
3. Critical records are append-only and immutable.
4. Every mutation is auditable.

## Tech Stack

- Backend: Node.js, Express, TypeScript, PostgreSQL
- Frontend: React, TypeScript
- Auth: JWT + optional Google OAuth SSO
- Deployment: Render (web service + static site)

## Repository Layout

```text
.
├── backend/
│   ├── migrations/
│   ├── scripts/manual/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middlewares/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   └── uploads/evidence/
├── frontend/
│   ├── public/
│   └── src/
├── docs/
│   ├── setup/
│   ├── qa/
│   └── ExecutionPlans/
├── .github/workflows/
└── render.yaml
```

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+

### Install

```bash
npm --prefix backend install
npm --prefix frontend install
```

### Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Run Migrations and Start

```bash
npm --prefix backend run migrate
npm --prefix backend run dev
npm --prefix frontend start
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Environment Variables

Use [backend/.env.example](backend/.env.example) and [frontend/.env.example](frontend/.env.example) as source-of-truth templates.

### Backend minimum required

- DATABASE_URL
- JWT_SECRET
- FRONTEND_URL

### Optional/conditional backend

- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL
- STORAGE_PROVIDER (set to s3 for object storage)
- S3_BUCKET, S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY (required when STORAGE_PROVIDER=s3)

### Frontend

- REACT_APP_API_URL (example: http://localhost:5000/api)

## Quality Gates

- Backend typecheck: `npm --prefix backend run typecheck`
- Backend env validation: `npm --prefix backend run validate:env`
- Backend DB validation: `npm --prefix backend run validate:db`
- Backend tests: `npm --prefix backend run test`
- Frontend build: `npm --prefix frontend run build`

## CI

CI workflow is defined in [.github/workflows/ci.yml](.github/workflows/ci.yml). It runs backend typecheck, frontend build, and phase validation before deploy hooks.
