# ZaroHR mobile web at `app.zarohr.com`

Host the Expo app as the mobile view of the HRMS: a static web export served
from its own subdomain, with the Next.js panel redirecting phone-sized clients
to it.

Status: design approved 2026-07-31. Implementation plan pending.

## Goal

Employees who open the HRMS on a phone get this app instead of the desktop
panel. No app store, no install — a static bundle behind a URL.

## Non-goals

- Native iOS/Android builds. EAS stays configured but untouched.
- PWA install / offline support. Manifest and service worker are a later pass.
- Bundle-size optimisation. Measured and accepted here, fixed separately.
- Wiring screens that still render mock data. This spec *finds* them; a
  follow-up spec fixes them.

## Topology

```
app.zarohr.com   →  Vercel static (this repo, `expo export -p web`)  ─┐
<panel domain>   →  Vercel (Next 16, Zaro-HRMS)                      ─┼─→  <api host> (Render, NestJS, /api)
                                                                      ┘
```

Three independent origins. Two consequences, both already solved upstream:

- The backend sets the refresh cookie `SameSite=None; Secure` in production
  (`Zaro-HRMS/backend/src/auth/auth.controller.ts:107`), so it survives a
  cross-origin request.
- CORS is an allowlist read from `CORS_ORIGIN` (`backend/src/main.ts:136`), so
  admitting the new origin is a config change on Render, not a code change.

The production API host is not committed anywhere in this repo — it lives in
Vercel/Render environment variables. The checked-in `.env.local` in the panel
points at `http://localhost:4000` and is local-dev only. Treat the API host as a
deploy-time parameter throughout.

## 1. Web compatibility fixes

`expo export --platform web` already exits 0 on the current tree (verified
2026-07-31: 5.83 MB raw, 1.22 MB gzipped). Nothing here is a build failure —
every item below is a **runtime** failure in a browser, so each fix is a
localised platform override rather than a refactor.

### 1a. Session persistence — critical

`src/api/client.ts` issues every request through `fetch` without
`credentials: 'include'`.

On native this is invisible: React Native's cookie jar replays the HttpOnly
refresh cookie regardless. In a browser, cross-origin `fetch` defaults to
`credentials: 'same-origin'`, so the cookie is **neither stored at login nor
sent on refresh**. The failure is delayed and confusing: sign-in succeeds, the
app works for 15 minutes, then the access token expires, `POST /api/auth/refresh`
returns 401 because it arrived with no cookie, and `AuthContext` signs the user
out. It reads as a random logout bug.

Fix: set `credentials: 'include'` at all three fetch sites —

- `refreshAccessToken` (`client.ts:110`),
- the main request in `apiRequest` (`client.ts:172`),
- the post-refresh retry (`client.ts:187`).

No-op on native. The panel's `src/utils/api.ts:31` already does exactly this;
this brings the mobile client to parity.

### 1b. `DelegateApprovalsModal`

`src/components/approvals/DelegateApprovalsModal.tsx:1` imports
`@react-native-community/datetimepicker` directly, which has no web build.

`src/components/CrossDatePicker.tsx` is a pure re-export of that same module,
with a `CrossDatePicker.web.tsx` sibling that Metro resolves on web. The call
site API is therefore identical.

Fix: change the import to `@/components/CrossDatePicker`. One line, no other
changes. This is also the pattern every future date-picker call site should
follow — the direct import is the anomaly.

### 1c. `DocumentPreview`

`src/components/profile/DocumentPreview.tsx:11` renders `WebView` from
`react-native-webview`, which has no web implementation.

Fix: add `DocumentPreview.web.tsx` rendering an `<iframe src={uri}>` with the
same props contract. Metro picks it up automatically; the native file is
untouched.

### 1d. `LiveDocumentsCard`

`src/components/profile/LiveDocumentsCard.tsx` downloads a document to the
cache with `expo-file-system/legacy`, then opens or shares it via
`expo-intent-launcher` (Android-only) or `expo-sharing`.

The IntentLauncher calls are already `Platform.OS === 'android'`-guarded, and
Sharing is guarded by `isAvailableAsync()`. The problem is the chain's
foundation: `FileSystem.downloadAsync` and `cacheDirectory` do not work on web,
so open / save / view-version all fail before reaching those guards.

Fix: add a web branch that skips the local-file round trip entirely and opens
the signed URL directly (`window.open`, or an `<a download>` for save). The
browser already knows how to display a PDF and how to download a file; the
native dance exists only because mobile OSes don't.

### 1e. `Alert.alert` is a no-op on web — critical

`react-native-web` ships `class Alert { static alert() {} }`. An empty function.
There are **55 call sites across 23 files**.

Two distinct failures:

- **44 informational calls** (errors, confirmations of success) vanish silently.
  A failed upload or an unreachable server produces no feedback at all.
- **11 calls carry an `onPress` callback in a button array**, and on web that
  callback never fires — so the action silently does nothing. This includes
  `app/(drawer)/settings.tsx:33` (**sign out**) and
  `app/(drawer)/(tabs)/approvals.tsx:54` (**approve / reject**), plus
  `apply-leave.tsx:334`, `notifications.tsx:108`, `support.tsx:39`,
  `AvatarActionSheet.tsx:89`, `PhotoPickerSheet.tsx:88`,
  `CollectionEditor.tsx:214`, `AttendanceCalendar.tsx:135`,
  `LeaveCalendar.tsx:123`, `ContactTile.tsx:10`.

Sign-out and approvals appearing to do nothing is disqualifying for an employee
deployment, so this is a launch blocker rather than a polish item.

Fix: a platform-split shim following the pattern already established by
`CrossDatePicker` and `secureStorage` — `src/lib/alert.ts` re-exports React
Native's `Alert` unchanged; `src/lib/alert.web.ts` implements the same signature
over `window.confirm` / `window.alert`, mapping a single-button call to `alert()`
and a two-button call to `confirm()`, invoking the matching `onPress`. Then
repoint the `Alert` import in all 23 files.

Mechanical, but it is the largest single task in this plan and it touches the
most files. It is also the reason a native-only codebase cannot simply be
pointed at a browser and shipped.

### 1f. Credential autofill on web

Native gets password autofill from the OS keychain. A browser gets nothing
unless the markup says what the fields are, and the sign-in produced none of the
required signals.

What already worked, and needed no change: `AuthContext` persists the org slug
unconditionally (surviving sign-out) and the email whenever "Remember me" is on,
and `sign-in.tsx` passes both on every sign-in path. The app's own memory of the
slug and email is fine.

What was missing is everything the *browser* needs:

- **No autofill tokens.** The email and password fields carried no
  `autoComplete`. Added `username` and `current-password` — `username` rather
  than `email` because that is the token password managers pair with
  `current-password` to form one stored credential. The org field already had
  `organization`.
- **No form element.** react-native-web renders bare inputs; nothing navigates
  on sign-in. With no `<form>` and no submit control, Chrome and Safari have no
  submission event to react to and generally never offer to save the login. A
  platform-split `AuthForm` (`AuthForm.tsx` passthrough / `AuthForm.web.tsx`
  real `<form>`) fixes this. `display: contents` keeps it out of layout so the
  flex tree is unchanged, and a hidden submit button makes both `requestSubmit()`
  and the Enter key work.
- **A two-step flow that unmounts the username.** This is the subtle one: on
  step 2 the email field is replaced by a summary row, so the DOM holds a lone
  password input. Password managers pair username with password, and with no
  username present both saving and refilling degrade. `AuthForm.web.tsx` renders
  a `hidden` `autocomplete="username"` input carrying the email for that step —
  the documented fix for username-first flows.

**Honest limitation:** password managers store a username/password pair per
origin, not three fields. The org slug is not part of the stored credential and
never will be. All three still end up filled, but by two different mechanisms —
the browser supplies email and password, the app supplies the slug from its own
storage (or from `?org=`).

## 2. Build configuration

### `app.json`

Extend the existing bare `web` block:

```json
"web": {
  "favicon": "./assets/favicon.png",
  "bundler": "metro",
  "output": "single",
  "themeColor": "#14323F",
  "backgroundColor": "#14323F"
}
```

`output: "single"` (SPA) is chosen over `"static"` deliberately. Static
prerendering requires every route to render without browser APIs, which is a
live risk given the components above, and it buys little for an app where every
screen is behind auth anyway. The cost is needing a catch-all rewrite, which is
one line of `vercel.json`.

`themeColor`/`backgroundColor` reuse the splash colour already in `app.json`, so
the browser chrome matches the app on Android.

### `vercel.json`

```json
{
  "rewrites": [
    { "source": "/((?!_expo|assets|favicon.ico|metadata.json).*)", "destination": "/index.html" }
  ],
  "headers": [
    { "source": "/_expo/static/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/index.html", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] }
  ]
}
```

The rewrite makes deep links (`/leave`, `/my-team`) serve the SPA shell instead
of 404ing. `immutable` caching is safe because Expo content-hashes every emitted
filename; `index.html` must stay uncached so a deploy is picked up immediately.

### Vercel project

- Repo: this one. Build `npx expo export --platform web`, output `dist`.
- Env: `EXPO_PUBLIC_API_BASE_URL=<production API origin, no /api suffix>`.
  `src/api/config.ts` appends `/api` itself and strips trailing slashes.
- Domain: `app.zarohr.com`.

`dist/` is gitignored and stays that way — Vercel builds it.

### Render

Append `https://app.zarohr.com` to `CORS_ORIGIN`. No redeploy of application
code required.

## 3. Panel redirect (Zaro-HRMS repo)

New `middleware.ts` in the Next.js panel: redirect mobile user agents to the
mobile site.

Three rails, all mandatory:

**Kill switch.** The middleware reads `MOBILE_REDIRECT_URL`. Unset or empty
skips the whole block. It ships **off** and is enabled by setting the variable.

Deliberately *not* `NEXT_PUBLIC_`-prefixed: those are inlined into the bundle at
build time, and the redirect target is server-side logic with no business in the
client bundle. Caveat to be honest about — on Vercel, changing the variable still
requires a redeploy to take effect, so this is a one-deploy toggle rather than an
instant switch.

**Escape hatch.** `?desktop=1` on any panel URL sets a `zaro_force_desktop`
cookie (1 year, `SameSite=Lax`) and suppresses the redirect from then on. The
mobile app links to it as "Desktop site". Without this a user on a large phone
or a tablet that trips the UA check has no way back.

**Public-route exclusions.** Every one of these is reached by an emailed link
carrying a token in the URL. Redirecting them drops the token and breaks the
flow, so all must pass through untouched:

- `/dashboard/employee/offer-letter-preview` — job candidates, who have no
  employee login at all. Redirecting them to the employee app is a dead end in
  the hiring flow.
- `/onboarding` (including `/onboarding/preview`) — same audience, same problem.
- `/reset-password` — the token is scoped to the panel. The mobile app has its
  own `(auth)/reset-password` route, but it cannot consume a link minted for the
  panel, so the redirect would turn a working reset into a failure.
- `/email-approval` — a manager acting on a single request from their inbox. The
  action is self-contained; bouncing them to the app root loses the request they
  clicked on.

`/login` is deliberately **not** excluded: a phone user signing in should land in
the mobile app.

Plus the usual `/api`, `/_next`, and static-asset exclusions, via the matcher.

The redirect targets the mobile **root**, not a path-mapped equivalent: panel
routes and mobile routes do not correspond 1:1, and guessing wrong lands users
on a 404 instead of a home screen.

### Tenant context must survive the redirect

The panel is multi-tenant: `extractTenantSlug` in `src/middleware.ts` reads the
left-most label of a non-apex host, so `acme.hrms.zarohr.com` resolves to tenant
`acme`, and the login page uses that to skip its Organization field.

The mobile app cannot do this — it is served from one fixed host, so
`app/(auth)/sign-in.tsx` asks for the org slug explicitly and remembers it per
device. That is correct for native, but it means a redirect from a tenant
subdomain **drops the tenant context**: the user lands on a sign-in form
demanding a slug they may not know, on a fresh browser that has nothing
remembered. The redirect would make login measurably worse for exactly the users
it targets.

Fix, in two halves:

- The middleware appends the resolved slug to the redirect:
  `https://app.zarohr.com/?org=<slug>`. On the apex, no param.
- Web sign-in reads `?org=` on first load and seeds the org field from it,
  taking precedence over nothing and deferring to an already-remembered slug
  only if the param is absent.

**Namespace note:** hosting at `app.zarohr.com` permanently reserves `app` as a
tenant slug — `extractTenantSlug` would resolve that host to tenant `app`. The
panel's middleware never runs on it (separate Vercel project), so nothing breaks
today, but `app` must be blocked from the tenant slug pool.

UA detection is a conservative regex over `Android|iPhone|iPod|Windows Phone`.
iPad is deliberately excluded — it reports a desktop UA on modern iPadOS and the
panel is usable at that size.

## 4. Wiring audit

`docs/backend-integration.md` is stale. It claims only sign-in and holidays are
wired; in fact 18 component files and 14 screens import real API modules, and
`approvalsData.ts`, `requestsData.ts` and `announcementsData.ts` have become
backend-backed adapters rather than mocks.

Deliverable: trace all 24 screens through their component tree to either
`src/api/*` or a `*Data.ts` mock, and rewrite `docs/backend-integration.md` with
an accurate `screen → endpoints → status` table where status is one of
`live` / `partial` / `mock`, plus an explicit gap list.

Known suspects, to confirm rather than assume: `attendance-log`, `documents`,
`support`, and the `(tabs)` attendance and leave screens.

Fixing the gaps is out of scope. The gap list is the product.

## 5. Testing and rollout

**Verification, in order:**

1. `npx expo export --platform web` exits 0.
2. Serve `dist` locally and load it in a phone-sized viewport. Sign in against a
   real backend.
3. **Session-survival check** — stay signed in past the 15-minute access-token
   expiry and confirm a subsequent request succeeds. This is the only test that
   proves fix 1a; nothing shorter distinguishes a working refresh from an
   access token that simply hasn't expired yet.
4. Exercise each fixed surface on web: delegate-approvals date picker, document
   preview, document open/save.
5. **Alert-dependent actions specifically** — sign out from Settings, and
   approve a request from Approvals. Both are silent no-ops before fix 1e, so
   they are the sharpest test of it. Then confirm an informational alert (e.g.
   an upload failure) is actually visible.
6. Deep-link directly to `/leave` and `/my-team` to confirm the rewrite.
7. Sign in from `https://app.zarohr.com/?org=<slug>` and confirm the org field
   is prefilled.

**Rollout:**

1. Deploy to `app.zarohr.com` with `NEXT_PUBLIC_MOBILE_REDIRECT_URL` unset.
2. Pilot: share the URL with a handful of employees. Redirect stays off, so the
   panel is unaffected and there is no rollback to perform if something is wrong.
3. Review the section-4 gap list and decide whether the mock-data surfaces block
   a general rollout.
4. Set `NEXT_PUBLIC_MOBILE_REDIRECT_URL` to enable the redirect.

## Risks

**Bundle size.** 1.22 MB gzipped in a single chunk, no code splitting. Slow on
poor mobile connections. Accepted for now; route-level splitting is a separate
pass with its own risk profile.

**Mock data reaching employees.** The audit exists to make this a decision
rather than a discovery. The redirect staying off until step 3 is what keeps it
from becoming an incident.

**UA sniffing is imprecise.** Mitigated by the escape hatch, not by trying to
make the regex perfect.
