# Eema frontend

Next.js presentation layer for the Eema venue marketplace. Spring Boot is the
authoritative API for users, venues, matching, bookings, pricing, checkout, and
Mollie payment verification.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The frontend runs at <http://localhost:3000>. The default Spring API base URL is
<http://localhost:8080/api>.

## Environment variables

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Browser | Spring Boot API base URL |
| `CALA_API_KEY` | Server only | Optional company-verification BFF credential |

Never place Mollie, Gemini, JWT-signing, or other backend secrets in frontend
environment variables. Cala verification is informational UX metadata only; it
does not authorize users, bookings, or payments.

## Boundaries

- `lib/api/` contains all Spring communication.
- `types/` mirrors Spring request/response DTOs and enums.
- `lib/auth/token.ts` isolates the temporary browser-token storage decision.
- `app/api/verify-booker` remains a narrow BFF solely to protect the Cala secret.
- Spring and its Mollie webhook are authoritative for booking and payment state.

## Current authentication tradeoff

The MVP stores access and refresh tokens in browser `localStorage`, isolated behind
`lib/auth/token.ts`. This is intentionally replaceable, but a successful XSS attack
could read those tokens. A future production hardening phase should evaluate an
HttpOnly-cookie/BFF session design alongside CSP and broader XSS controls.

## Backend TODOs

- Add `GET /api/bookings/{id}` with role-aware authorization.
- Expose booking confirmation/cancellation endpoints before adding those controls.
- Expose venue update/delete endpoints before adding owner editing controls.
- Correct the upload controller's duplicated `/api` path before upload integration.
