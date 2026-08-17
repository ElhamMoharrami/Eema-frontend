# Eema frontend

Next.js presentation layer for the Eema venue marketplace. Spring Boot is the
authoritative API for authentication, venues, matching, bookings, pricing,
checkout, Mollie payments, and booking state.

## Local end-to-end development

### Prerequisites

- Docker with Docker Compose
- Node.js and npm
- Mollie test credentials configured in the backend when testing checkout
- A Gemini credential configured in the backend when testing matching

You do **not** need a local PostgreSQL, Java, or Maven installation for the
normal Dockerized backend workflow.

For a fresh backend checkout, first create its local Docker environment file:

```bash
cd ~/workspace/Eema-backend
cp .env.example .env
```

Fill in only the backend test/development credentials needed for the flows you
want to exercise. Never copy those backend secrets into the frontend.

### Start services

Terminal 1 — Spring and PostgreSQL:

```bash
cd ~/workspace/Eema-backend
docker compose up --build
```

Terminal 2 — Next.js with hot reload:

```bash
cd ~/workspace/Eema-frontend
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>. Spring is expected at
<http://localhost:8080/api>; PostgreSQL stays managed by Docker.

Before testing, wait for the backend health check:

```bash
curl http://localhost:8080/api/actuator/health
```

It should return `{"status":"UP"}`. While Spring/PostgreSQL are still starting,
the frontend may show “We could not reach Eema”; retry once health reports `UP`.

### Frontend environment

The minimal `.env.local` is:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

To test optional company verification, add a server-only development key:

```dotenv
CALA_API_KEY=<server-only-development-key>
```

Do not add `MOLLIE_API_KEY`, `GEMINI_API_KEY`, `JWT_SECRET`, or database
credentials to the Next.js environment. Those belong to Spring.

### Safe local seed accounts

The backend README explicitly defines these as development-only seed users:

- OWNER: `owner@eema-dev.local` / `password123`
- SCOUT: `scout@eema-dev.local` / `password123`

You can also register a new SCOUT or OWNER from the frontend. ADMIN registration
is not available.

## Manual E2E checklist

### A. Verify startup

- Open <http://localhost:3000>.
- Confirm active venues load from `GET /api/venues`.
- Sign in with a seed account or register a new account.

### B. Scout and Mollie test flow

1. Sign in or register as SCOUT.
2. Enter a venue brief and run authenticated matching.
3. Select a venue, shoot date, and contact information.
4. Start checkout. Spring creates the booking and Mollie payment.
5. The browser redirects to Spring's returned `checkoutUrl`.
6. Complete the Mollie **TEST** checkout.
7. Mollie redirects the browser to <http://localhost:3000/booked>.
8. `/booked` fetches authoritative state from `GET /api/bookings/{id}`.
9. Verify the booking moves from `PENDING` to `PAID` after the webhook.
10. Check the same state under <http://localhost:3000/scout/bookings>.

The frontend never calls Mollie, trusts redirect parameters, or changes payment
state locally.

### C. Manual Mollie webhook

Localhost cannot receive Mollie's public callback unless you configure a tunnel.
For manual mode, leave backend `MOLLIE_WEBHOOK_URL` blank. After completing the
test payment, obtain the `tr_...` payment ID from the checkout response in browser
developer tools or the Mollie test dashboard, then follow the backend README command:

```bash
curl -X POST http://localhost:8080/api/webhooks/mollie/payment \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'id=tr_...'
```

Spring retrieves the authoritative Mollie payment before changing booking state.
For automatic callbacks, follow the trusted-tunnel instructions in the backend
README and keep `MOLLIE_REDIRECT_URL=http://localhost:3000/booked`.

### D. Owner flow

1. Sign in as OWNER.
2. Open <http://localhost:3000/owner/venues> to verify owned venues.
3. Open <http://localhost:3000/owner/bookings>.
4. Find a `PAID` booking and confirm it.
5. Verify Spring returns and displays `CONFIRMED`.

### E. Cancellation flow

1. Create another checkout as SCOUT but do not complete payment.
2. Return to the booking list while it is still `PENDING`.
3. Cancel it.
4. Verify Spring returns and displays `CANCELLED`.

Cancellation is intentionally unavailable after payment.

### F. Refunds

Refund is currently an ADMIN/backend operational flow. The SCOUT and OWNER
interfaces display authoritative refund state but expose no refund action.

## Database and logs

PostgreSQL is stored in the backend Docker volume; do not install it locally.
Use the backend README for log inspection and database commands.

To fully reset local backend data, the backend documents:

```bash
cd ~/workspace/Eema-backend
docker compose down -v
docker compose up --build
```

`docker compose down -v` permanently deletes the local Docker database and upload
volumes. It is not a normal restart command.

## Frontend commands

```bash
npm run dev       # local hot-reload server
npm run typecheck # TypeScript
npm run lint      # project-local Next.js ESLint
npm run build     # production build
npm run check     # typecheck + lint + build
```

## Architecture and security boundaries

- `lib/api/` contains all Spring communication.
- `NEXT_PUBLIC_API_BASE_URL` is the only browser-visible backend configuration.
- `app/api/verify-booker` is the sole Next.js BFF route and protects the optional
  server-only Cala credential.
- Spring and its Mollie webhook own payment and refund state.
- The frontend shows concise retry/auth/role/empty states and never displays raw
  backend stack traces.
- Browser tokens currently live in `localStorage`, isolated by `lib/auth/token.ts`.
  A future production hardening phase should evaluate HttpOnly cookies and CSP.

## Future admin UI

Spring exposes an ADMIN-only `POST /api/bookings/{id}/refund` endpoint. Refund
controls are intentionally absent from the current frontend.

## Backend TODOs

- Expose venue update/delete endpoints before adding owner editing controls.
- Correct the upload controller's duplicated `/api` path before upload integration.
