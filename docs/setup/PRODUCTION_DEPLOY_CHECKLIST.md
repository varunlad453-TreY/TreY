# Production Deployment Checklist

This checklist closes the remaining operational work for Phase 5 Track B.

Legend:
- [x] Completed in production
- [ ] Pending production action

## Environment Source of Truth
- [x] New device setup template: `backend/.env.example` and `frontend/.env.example`.
- [x] Backend test template: `backend/.env.test.example`.
- [x] Local backend dev runtime: `backend/.env` (local only, gitignored).
- [x] Local backend test runtime: `backend/.env.test` (local only, gitignored).
- [x] Production environment values: hosting provider secret manager only (Render/Vercel/GitHub Secrets), not repository files.

### Test Database Preparation
- Run test DB migrations: `npm --prefix backend run migrate:test`
- Seed test DB data: `npm --prefix backend run seed:test`
- One-shot setup: `npm --prefix backend run test:prepare`

## Local Preflight (Already Verified)
- [x] Backend typecheck passes (`npm --prefix backend run typecheck`).
- [x] Frontend build passes (`npm --prefix frontend run build`).
- [x] Database validation script passes (`npm --prefix backend run validate:db`).
- [x] Core lifecycle validator passes (`npm --prefix backend run validate:phase4`).
- [x] Storage adapter works in local/staging configuration.

## 1) Cloud Database
- [x] Provision managed PostgreSQL instance (Neon/Supabase/RDS).
- [ ] Set production DATABASE_URL in hosting provider secrets.
- [ ] Run migrations against production DB (`npm --prefix backend run migrate`).
- [ ] Validate production DB setup (`npm --prefix backend run validate:db`).
- [ ] Validate production lifecycle path (`npm --prefix backend run validate:phase4`).

## 2) Secrets and Rotation
- [ ] Rotate all previously exposed credentials (DB, R2, OAuth, SMTP).
- [ ] Set quarterly secret rotation cadence.
- [ ] Store secrets only in provider secret managers (not in source control).
- [ ] Verify production secrets are set only in host secret manager and not committed.

## 3) Object Storage (R2/S3)
- [ ] Create production bucket.
- [ ] Create least-privilege access policy for object read/write on evidence prefix only.
- [ ] Set production backend env `STORAGE_PROVIDER=s3`.
- [ ] Set production backend env `S3_BUCKET`.
- [ ] Set production backend env `S3_REGION`.
- [ ] Set production backend env `S3_ENDPOINT`.
- [ ] Set production backend env `S3_ACCESS_KEY_ID`.
- [ ] Set production backend env `S3_SECRET_ACCESS_KEY`.
- [ ] Run production upload/download smoke test through API.

## 4) Domain and TLS
- [ ] Configure frontend custom domain.
- [ ] Configure backend API custom domain.
- [ ] Ensure HTTPS certificates are active on both domains.
- [ ] Set `FRONTEND_URL` and `REACT_APP_API_URL` to production domains.

## 5) CI/CD and Deploy Hooks
- [ ] Configure GitHub secret `DATABASE_URL`.
- [ ] Configure GitHub secret `JWT_SECRET`.
- [ ] Configure GitHub secret `RENDER_BACKEND_DEPLOY_HOOK`.
- [ ] Configure GitHub secret `RENDER_FRONTEND_DEPLOY_HOOK`.
- [x] Confirm CI workflow exists for PR and main.
- [ ] Confirm deploy hooks trigger only after green checks on main.

## 6) Monitoring and Alert Routing
- [ ] Set `SENTRY_DSN` in backend and `REACT_APP_SENTRY_DSN` in frontend.
- [ ] Set `SENTRY_TRACES_SAMPLE_RATE` and `REACT_APP_SENTRY_TRACES_SAMPLE_RATE`.
- [ ] Configure alert routing policy for critical alerts (Pager/On-call).
- [ ] Configure alert routing policy for error spikes (Slack channel).
- [ ] Configure alert routing policy for daily summaries (Email).
- [ ] Validate by triggering one test exception in staging.

## 7) Final Go-Live Gate
- [ ] Backend typecheck passes in production pipeline.
- [ ] Frontend build passes in production pipeline.
- [ ] Database validation passes against production DB.
- [ ] Phase 4 lifecycle validator passes against production DB.
- [ ] Production smoke: Create obligation.
- [ ] Production smoke: Assign owner.
- [ ] Production smoke: Upload evidence.
- [ ] Production smoke: Download evidence.
- [ ] Production smoke: Export ZIP/PDF.
