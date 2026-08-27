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

### B. Scout request and Mollie test flow

1. Sign in or register as SCOUT.
2. Enter a venue brief and run authenticated matching.
3. Select a venue, shoot date, time range, and contact information. The frontend
   shows an informational estimate from the hourly rate, minimum booking duration,
   and optional full-day cap.
4. Submit the request. Spring creates a `REQUESTED` booking and returns the
   authoritative `venuePriceEur`; the request does not reserve inventory.
5. Sign in as the venue OWNER, open <http://localhost:3000/owner/bookings>, and
   accept the request before its response deadline. The booking becomes
   `AWAITING_PAYMENT` and reserves the selected time.
6. Return as the SCOUT and choose **Pay now** before the payment deadline.
7. The browser redirects to Spring's returned `checkoutUrl`.
8. Complete the Mollie **TEST** checkout.
9. Mollie redirects the browser to <http://localhost:3000/booked>.
10. `/booked` fetches authoritative state from `GET /api/bookings/{id}`.
11. Verify an on-time successful payment produces `CONFIRMED` after the webhook.
12. Check the same state under <http://localhost:3000/scout/bookings>.

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
4. Accept a `REQUESTED` booking or decline it before the displayed response deadline.
5. After acceptance, verify the owner sees `AWAITING_PAYMENT` with no second
   confirmation action. Successful scout payment changes it directly to `CONFIRMED`.

### E. Refunds

Refund is currently an ADMIN/backend operational flow. The SCOUT and OWNER
interfaces display authoritative refund state but expose no refund action.

### F. Cancellations

Scout cancellation is available from the booking detail page:

- `REQUESTED` and `AWAITING_PAYMENT` bookings can be withdrawn without a refund
  because payment has not completed.
- `CONFIRMED` bookings first load the authoritative cancellation preview from
  Spring. The scout must review the policy tier, refund percentage, refund amount,
  and retained amount before explicitly confirming.
- A successful cancellation produces `CANCELLED`. `RefundStatus` separately tracks
  whether any required provider refund is being created, processed, completed, or
  requires attention.

An owner can cancel a `CONFIRMED` booking from its detail page after providing a
reason. Spring applies the owner full-refund policy; the scout receives a full
refund and the owner receives no payout. Administrative cancellation remains a
backend operations capability and has no frontend controls.

The frontend never derives cancellation eligibility or economics from policy
timestamps. Spring re-evaluates the policy when cancellation is submitted.

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
- Venue pricing is `hourlyRateEur` plus `minimumBookingMinutes`, with an optional
  `fullDayRateEur` cap. Booking pages explain the immutable pricing snapshot and
  always treat `BookingDto.venuePriceEur` as authoritative.
- The booking lifecycle is `REQUESTED → AWAITING_PAYMENT → CONFIRMED`. Requests
  can instead become `DECLINED`, response/payment windows can become `EXPIRED`,
  and overlapping requests can become `UNAVAILABLE`. Refunds end in `REFUNDED`.
- The frontend shows concise retry/auth/role/empty states and never displays raw
  backend stack traces.
- Browser tokens currently live in `localStorage`, isolated by `lib/auth/token.ts`.
  A future production hardening phase should evaluate HttpOnly cookies and CSP.

## Admin operations

ADMIN accounts have a focused console at `/admin`, with routes for
`/admin/exceptions`, `/admin/bookings`, `/admin/bookings/[id]`, `/admin/payouts`,
`/admin/payouts/[id]`, `/admin/liabilities`, and `/admin/liabilities/[id]`.
Spring authorization remains authoritative; frontend role checks provide UX only.

The only admin mutations exposed are marking a READY payout paid and settling an
OPEN owner liability. **“Mark paid” records an external transfer; it does not send
money.** Marking a liability settled records settlement state; it does not move
money or replace the backend amount. The console deliberately has no generic
booking-status, refund, fee, amount, event, waiver, or analytics controls.

## Financial documents

SCOUT users can download a booking receipt from a confirmed or historically paid
booking detail page. OWNER users can open **Payouts**, review payout status and
backend-provided ledger values, then download a payout statement once the payout
is `PAID` and Spring reports that a statement is available.

PDFs are requested from authorized Spring endpoints and are never generated or
calculated by the frontend. A booking receipt is not a tax invoice, and a payout
statement is not a tax invoice.

## Email verification and password recovery

Registration sends a verification email. The link opens `/verify-email`, verifies
the token with Spring, and reactively updates the signed-in user. Unverified users
may continue browsing and reading their dashboards, but marketplace mutations
such as booking, payment, inquiry, booking-response, and listing-management actions
require email verification. Spring remains authoritative for enforcement.

“Forgot password?” opens `/forgot-password`. Reset links open `/reset-password`,
where a new 8–72 character password is submitted directly to Spring. After a
successful reset the frontend clears the existing local session because backend
refresh tokens have been revoked. Verification and reset tokens are never stored.

## Backend TODOs

- Expose venue update/delete endpoints before adding owner editing controls.
- Correct the upload controller's duplicated `/api` path before upload integration.
