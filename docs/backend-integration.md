# Backend integration

The app talks to the same NestJS backend as the web panel (`Zaro-HRMS/backend`),
which serves everything under a global `/api` prefix on port `4000`.

## Configuration

| Setting | Where | Default |
| --- | --- | --- |
| API base URL | `EXPO_PUBLIC_API_BASE_URL` | the Expo dev-server host on port `4000` |

With no env var set, [`src/api/config.ts`](../src/api/config.ts) derives the host
from Expo's `hostUri`, so a phone on the same Wi-Fi hits the laptop's LAN IP
(`http://192.168.x.x:4000`) instead of an unreachable `localhost`. Set the env
var for staging/production builds. Plain-HTTP hosts only work in dev builds —
release builds block cleartext traffic, so ship an HTTPS URL.

Run the backend locally with:

```bash
cd ../Zaro-HRMS/backend && npm run start:dev
```

## HTTP layer

[`src/api/client.ts`](../src/api/client.ts) is the single entry point:

- attaches `Authorization: Bearer <accessToken>` (kept in `expo-secure-store`),
- parses Nest's `{ message, error, statusCode }` envelope into `ApiError`,
- raises `NetworkError` when the host cannot be reached at all,
- on a `401`, calls `POST /api/auth/refresh` once and retries; the refresh token
  is the HttpOnly cookie the backend sets at login, replayed by React Native's
  native cookie jar. If the refresh fails the session is cleared and
  `AuthContext` signs the user out.

Server state goes through TanStack Query (`src/api/queryClient.ts`, provider in
`app/_layout.tsx`). 4xx responses are not retried.

## Wired so far

| Screen | Endpoints |
| --- | --- |
| Sign in | `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh` |
| Holidays | `GET /api/requests/calendar?year=`, `GET /api/requests/optional-holidays/context`, `POST /api/requests/optional-holidays/claim`, `POST /api/requests/optional-holidays/:claimId/cancel` |
| Quick actions (policy portal, LMS) | `GET /api/services/available`, `GET /api/services/:key/launch` |

## Satellite launches (policy portal, LMS)

The app never holds a satellite's launch secret. `src/api/services.ts` asks the
backend for a signed URL per tap and hands it to an in-app browser
(`QuickActionsCard.tsx`), so the secret stays server-side and the same flow
serves web and app.

**The app needs no URL registered on the satellite.** When you enable HRMS
launch on the policy portal you must fill an "Allowed iframe origin" field —
put the **web panel's** origin there. That value only widens the
`frame-ancestors` CSP header for iframe embeds; `GET /api/hrms/launch` never
reads it, so a launch from the app succeeds no matter what it holds. The LMS
has no origin field at all. See
`Zaro-HRMS/docs/satellite-services-integration.md` for the full rationale.

MFA-protected accounts and accounts flagged `passwordResetRequired` are turned
away with a message — neither flow exists in the app yet, both are completed on
the web portal.

## Demo session

The hardcoded demo credentials (`src/auth/demoCredentials.ts`) still work, but
only as an offline fallback: sign-in tries the backend first and falls back to
the demo session only when the server is unreachable. A demo session sets no
bearer token, `useAuth().isBackendSession` is `false`, and screens render their
mock data instead of firing requests.

## Still on mock data

Home widgets, attendance, leave/requests, approvals, my team, celebrations,
announcements, documents, profile, notifications and support. The backend
already exposes most of it — e.g. `GET /api/requests/mine`,
`/api/requests/mine/summary`, `/api/requests/settings`,
`/api/requests/calendar/upcoming`, `/api/requests/manager/approvals`,
`/api/attendance/*`, `/api/announcements` — so each screen is a matter of adding
a query module beside `src/api/holidays.ts`.
