# Production Bootstrap Runbook

This runbook lists every new resource you need to create and how to wire it safely.

## 1) New Resources To Create

### A) Render

1. Create a new Render project for production (recommended).
2. Create a production backend service in that project.
3. Create a production frontend service in that project.
4. Keep current Render services as dev or staging.

### B) Databases

1. Keep current database as dev only.
2. Create one new production PostgreSQL database.
3. Optional but recommended: create one separate staging PostgreSQL database.

Naming recommendation:
- trey-dev-db
- trey-staging-db
- trey-prod-db

### C) Google OAuth

1. In Google Cloud Console, create one OAuth client for dev.
2. Create one separate OAuth client for production.
3. Set callback URL in each client to match the backend URL of that environment.

Required callback values:
- Dev callback: https://<your-dev-backend-domain>/api/auth/google/callback
- Prod callback: https://<your-prod-backend-domain>/api/auth/google/callback

Important:
- Do not reuse production OAuth secret in dev.

### D) Cloudflare R2

1. Create one dev bucket.
2. Create one production bucket.
3. Create separate R2 API credentials for dev and production.
4. Scope credentials to least privilege for each bucket.

Naming recommendation:
- trey-dev-evidence
- trey-prod-evidence

### E) Optional Service Integrations

1. SMTP account or provider credentials for production notifications.
2. Sentry project DSN for production.
3. Separate Sentry DSN for dev or staging if needed.

## 2) Environment Variable Mapping

Production environment values are entered in the Render service dashboard for the production backend and frontend. Do not place production secrets in any repository env file.

Use the repo files only as templates or for local/test runtime values:
- `backend/.env.example` -> local development template
- `backend/.env.test.example` -> local test template
- `backend/.env` and `backend/.env.test` -> local-only runtime files, gitignored
- `frontend/.env.example` -> local development template
- `frontend/.env` -> local-only runtime file, gitignored

## Backend Dev Service Variables

- NODE_ENV = development
- DATABASE_URL = dev database URL
- JWT_SECRET = dev secret
- FRONTEND_URL = dev frontend URL
- STORAGE_PROVIDER = local or s3
- S3_BUCKET = trey-dev-evidence (if s3)
- S3_ENDPOINT = your R2 endpoint
- S3_ACCESS_KEY_ID = dev R2 key
- S3_SECRET_ACCESS_KEY = dev R2 secret
- GOOGLE_CLIENT_ID = dev OAuth client id
- GOOGLE_CLIENT_SECRET = dev OAuth client secret
- GOOGLE_CALLBACK_URL = dev callback URL
- SMTP_* = dev or sandbox SMTP values
- SENTRY_DSN = dev DSN optional

## Backend Production Service Variables

- NODE_ENV = production
- DATABASE_URL = production database URL
- JWT_SECRET = production secret
- FRONTEND_URL = production frontend URL
- STORAGE_PROVIDER = s3
- S3_BUCKET = trey-prod-evidence
- S3_ENDPOINT = your R2 endpoint
- S3_ACCESS_KEY_ID = prod R2 key
- S3_SECRET_ACCESS_KEY = prod R2 secret
- GOOGLE_CLIENT_ID = prod OAuth client id
- GOOGLE_CLIENT_SECRET = prod OAuth client secret
- GOOGLE_CALLBACK_URL = prod callback URL
- SMTP_* = production SMTP values
- SENTRY_DSN = production DSN optional

## Frontend Dev Service Variables

- REACT_APP_API_URL = dev backend URL plus /api
- REACT_APP_SENTRY_DSN = dev DSN optional

## Frontend Production Service Variables

- REACT_APP_API_URL = production backend URL plus /api
- REACT_APP_SENTRY_DSN = production DSN optional

## 3) Post Setup Commands

Run these against production backend service after setting production DATABASE_URL.

1. npm --prefix backend run migrate
2. npm --prefix backend run validate:db

Run this only if you explicitly want production sample data:
3. npm --prefix backend run seed

## 4) Safety Rules

1. Never point prod service DATABASE_URL to dev database.
2. Never reuse prod OAuth or prod R2 keys in dev.
3. Never store production secrets in repo files.
4. Rotate any secret that was previously exposed.

## 5) How Both Environments Run At The Same Time

1. Dev services use dev environment variables and dev database.
2. Production services use production environment variables and production database.
3. Same codebase is deployed to both, but configuration is different per service.
4. Service URL does not define database. DATABASE_URL env variable defines database.
 