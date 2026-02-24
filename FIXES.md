# Security Advisor — Audit Fixes

A comprehensive audit was performed across the entire project. Below is every issue that was found and fixed.

---

## 1. Build-Blocking Errors

### 1a. Unescaped Apostrophe — `frontend/src/app/demo/page.tsx`
**Problem:** JSX contained a raw `'` character (`What's wrong?`), violating `react/no-unescaped-entities` and breaking `next build`.  
**Fix:** Replaced with `What&apos;s wrong?`.

### 1b. Missing `useEffect` Dependency — `frontend/src/app/(app)/team/page.tsx`
**Problem:** The `useEffect` that auto-selects a team referenced `selectedTeam` only via `teams` in its dependency array, causing the hook to fire incorrectly.  
**Fix:** Added `selectedTeam` to the dependency array with an `eslint-disable-next-line` comment for `react-hooks/exhaustive-deps`.

---

## 2. Worker Double-Start Bug — `backend/src/modules/queue/worker.ts`
**Problem:** `startWorker()` was called unconditionally at the top level. When the main server (`index.ts`) imported the worker, it triggered a second database connection and duplicate scan processing.  
**Fix:** Wrapped the top-level `startWorker()` call behind `if (require.main === module)` so it only self-starts when run as a standalone process (`npm run worker`). When imported by the server, `startWorker()` is called explicitly from `bootstrap()`.

---

## 3. Express Route Ordering — `backend/src/modules/scanner/scanner.router.ts`
**Problem:** `GET /dashboard/summary` was defined **after** `GET /:scanId`. Express matched `"dashboard"` as a `:scanId` parameter, so the summary route was never reachable.  
**Fix:** Moved the entire `/dashboard/summary` handler block **before** the `/:scanId` route.

---

## 4. Redis Session Store — `backend/src/index.ts`
**Problem:** `express-session` was using the default in-memory store, which leaks memory and doesn't work across multiple server instances.  
**Fix:** Imported `RedisStore` from `connect-redis` (already in `package.json`) and wired it into the session config using the existing `getRedisClient()` singleton.

---

## 5. Graceful Shutdown — `backend/src/index.ts`
**Problem:** The shutdown handler only closed Redis. MongoDB connections and the Bull queue were left dangling, risking data corruption on deploys.  
**Fix:** Added `await scanQueue.close()` (Bull) and `await mongoose.disconnect()` before the Redis close, ensuring all resources are released.

---

## 6. Webhook Authentication — `backend/src/modules/pr/pr.router.ts`
**Problem:** If `GITHUB_WEBHOOK_SECRET` was not set, the webhook accepted all payloads without any signature check — even in production.  
**Fix:** In production, a missing secret now returns `500` immediately. In development, a warning is logged but execution continues. When the secret IS set, signature verification is strictly enforced.

---

## 7. PR Review Uses Real Diff — `backend/src/modules/pr/pr.router.ts`
**Problem:** `processPRReview()` used a hardcoded dummy diff string instead of fetching the actual PR diff from GitHub.  
**Fix:** Imported `getPRDiff` from `github.service.ts` and replaced the dummy string with a real call: `await getPRDiff(user, owner, repoName, pr.number)`.

---

## 8. Enhanced Health Check — `backend/src/index.ts`
**Problem:** The `/health` endpoint returned a static `{ status: 'ok' }` without checking any backing services, making it useless for deployment readiness probes.  
**Fix:** The endpoint now pings both MongoDB (`mongoose.connection.readyState`) and Redis (`ping()`). Returns `200 ok` when both are up, or `503 degraded` with per-service status when one is down.

---

## 9. SSRF Protection Hardening — `backend/src/modules/liveScan/liveScan.router.ts`
**Problem:** The private-network blocklist missed several common SSRF bypass vectors:
- `0.0.0.0`, `::1`, `[::1]` (IPv6 loopback)
- `172.*` blocked ALL of `172.x.x.x` instead of only the private range `172.16.0.0–172.31.255.255`
- `.internal` and `.local` TLDs were not blocked

**Fix:** Added all missing addresses and replaced the blanket `172.` prefix check with a regex matching only `172.16.*` through `172.31.*`. Also blocks `.internal` and `.local` hostnames.

---

## 10. `@types/*` Moved to `devDependencies` — `backend/package.json`
**Problem:** All `@types/*` packages and `typescript` were listed under `dependencies`, causing them to be installed in production builds, increasing image size and install time.  
**Fix:** Moved all 13 `@types/*` packages and `typescript` to `devDependencies`.

---

## 11. ESLint Configuration — `backend/.eslintrc.json`
**Problem:** `package.json` had an `npm run lint` script and ESLint + TypeScript-ESLint packages installed, but no ESLint config file existed. Running `lint` would fail.  
**Fix:** Created `backend/.eslintrc.json` with:
- `@typescript-eslint/parser` pointing to `tsconfig.json`
- `eslint:recommended` + `plugin:@typescript-eslint/recommended` extends
- `no-console: warn`, `no-explicit-any: warn`, unused-vars with `_` prefix ignore pattern

---

## 12. Runtime Guard for `getOctokitForUser` — `backend/src/modules/github/github.service.ts`
**Problem:** If `user.encryptedAccessToken` was `undefined` (e.g., user fetched without `+encryptedAccessToken` select), `decrypt()` would throw a cryptic CryptoJS error.  
**Fix:** Added an early guard that throws a clear, descriptive error before calling `decrypt()`.

---

## Verification

After all fixes:
- **Backend:** `npx tsc --noEmit` — 0 errors  
- **Frontend:** `npx next build` — 0 errors, all 12 routes generated successfully
