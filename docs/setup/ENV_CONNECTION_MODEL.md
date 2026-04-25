# Environment Connection Model

This document explains exactly where each environment is created and where its secrets are stored.

For a full list of new resources to create (OAuth, R2, DB, Render services), see docs/setup/PRODUCTION_BOOTSTRAP_RUNBOOK.md.

## 1) Development (local)

- Backend runtime file: `backend/.env` (local, gitignored)
- Frontend runtime file: `frontend/.env` (local, gitignored)
- Database location: local Postgres (`trey_dev`) or your chosen non-production cloud DB

Connection path:
- Frontend (`http://localhost:3000`) -> Backend (`http://localhost:5000`) -> Dev DB (`trey_dev`)

## 2) Test (local/CI)

- Backend runtime file: `backend/.env.test` (local, gitignored)
- Database location: dedicated test DB (`trey_test`)
- Setup command: `npm --prefix backend run test:prepare`

Connection path:
- Test runner/scripts -> Backend services -> Test DB (`trey_test`)

## 3) Production (platform-managed)

Production secrets are NOT stored in repository env files.

Where production DB is created:
- Create managed Postgres in your cloud provider (recommended: Neon, Render Postgres, Supabase, RDS).

Where production DB URL is kept:
- In your platform secret manager (Render Environment Variables / Vercel Project Variables / GitHub Actions Secrets).
- Required key name: `DATABASE_URL`

Where other production secrets are kept:
- Platform secret manager with keys like:
  - `JWT_SECRET`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
  - `GOOGLE_CLIENT_SECRET`
  - `SMTP_PASSWORD`
  - `SENTRY_DSN`

## 4) How dev and production are connected at the same time

They are not sharing one env file.
Each runtime gets its own env set:

- Local backend process reads `backend/.env`
- Platform backend service reads Render/Vercel env variables

Both can run simultaneously because they are separate processes with separate environment variable scopes.

## 5) Render wiring in this repository

In `render.yaml`:
- `DATABASE_URL` is declared with `sync: false`
- This means Render expects you to provide real value in Render Dashboard, not in git
- `FRONTEND_URL` and `REACT_APP_API_URL` are connected between services using `fromService`

## 6) Required production setup sequence

1. Create production DB in managed provider.
2. Copy DB connection string.
3. Paste as `DATABASE_URL` in Render backend service environment variables.
4. Set all remaining production secrets in Render.
5. Deploy.
6. Run migrations against production (`npm --prefix backend run migrate`).
7. Validate production DB (`npm --prefix backend run validate:db`).
