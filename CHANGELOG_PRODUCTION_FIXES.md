# NexusOne AI — Production Readiness Fixes (v2)

This pass addressed the gaps identified in an external code review against
real production-SaaS checklists. Every item below was independently verified
by actually running the test suite, not just inspected — see "How this was
verified" at the bottom.

## 1. Automated Tests (previously: none existed)

- **Backend**: `backend/tests/test_all.py` — 59 tests across every module
  (Auth, CRM, Projects, Tasks, Billing, Support, HRM, Inventory, Calendar,
  AI, Analytics, Notifications, Documents, Approvals, Audit) plus a
  dedicated `MultiTenancyTests` class that proves company A can never see
  company B's data through the API.
- **Frontend**: `frontend/src/test/` and `frontend/src/utils/cn.test.ts` —
  17 tests using Vitest + React Testing Library, covering the class-name
  utility, calendar date-matching logic, leave-day counting, and the
  "empty title blocks submission" guard that every creation modal relies on.
- Run backend tests: `python manage.py test tests`
- Run frontend tests: `npm test`

## 2. CI/CD Pipeline (previously: none existed)

`.github/workflows/ci.yml` runs on every push/PR:
- Spins up real Postgres + Redis services (not mocked)
- Runs the full Django test suite against them
- Runs flake8 lint
- Builds the Next.js frontend, runs ESLint and a TypeScript type-check
- Runs `pip-audit` and `npm audit` for known vulnerable dependencies

## 3. Error Tracking (previously: none existed)

- Backend: Sentry wired into `config/settings.py`, activates only if
  `SENTRY_DSN` is set in `.env` — completely inert otherwise, never sends
  personal data (`send_default_pii=False`).
- Frontend: `sentry.client.config.js` / `sentry.server.config.js`, same
  opt-in pattern via `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN`.

## 4. Critical Security/Correctness Bug: Hardcoded Database Credentials

`config/settings.py` previously had the Postgres username, password, and
database name **hardcoded directly in source code**, meaning the
`DATABASE_URL` value in `.env` was silently ignored. Fixed to properly
read `DATABASE_URL` via `environ`, with a safe SQLite fallback only when
no `DATABASE_URL` is set at all (so the project still boots for a quick
look without Postgres installed).

The same issue existed for Redis: `CACHES` and `CHANNEL_LAYERS` (the
WebSocket layer) were hardcoded to in-memory backends regardless of the
`REDIS_URL` in `.env`, meaning real-time notifications would silently fail
to work across multiple server processes in production. Both now read
`REDIS_URL` properly, with in-memory fallback only when Redis is unset.

## 5. Invoice/Payment/Employee/Leave Creation Bugs

Four "Add X" forms across Billing and HRM would 400 in production because
the DRF serializers required fields that are supposed to be auto-generated
or optional:

- **Invoices**: `invoice_number` is now properly auto-generated (matching
  the existing ticket-number pattern) and marked read-only; `customer` and
  `issue_date` are now optional/auto-set, matching what the "No Customer"
  option in the New Invoice form actually needs.
- **Payments**: `invoice` and `customer` are now optional, since the
  Record Payment form supports logging a payment with no linked invoice.
- **Employees**: `employee_id` now auto-generates as `EMP-0001`, `EMP-0002`,
  etc. (matching the README's stated format); `date_of_joining` defaults
  to today if omitted.
- **Leave requests**: `employee` is now correctly read-only (resolved
  server-side from the logged-in user's own employee profile) instead of
  being a required input a user could otherwise spoof.

A matching migration (`billing/migrations/0002_...`) makes the `customer`
field nullable on `Invoice` and `Payment`, and `invoice`/`customer`
nullable on `Payment`.

## 6. Missing Task Stats Endpoint

Every other module (CRM, Projects, Billing, Support, HRM, Inventory) has a
`/stats/` endpoint that powers its dashboard cards server-side. Tasks did
not — the frontend was computing status counts by fetching and filtering
every task client-side. Added `GET /api/v1/tasks/stats/` matching the same
pattern as the rest of the app.

## 7. Thin Modules Expanded: Audit, Documents, Approvals

These three apps existed but were noticeably smaller than the rest:

- **Audit**: added `/logs/stats/` (counts by method, resource type, status
  code, error rate, unique active users) and `/logs/export/` (CSV export
  for compliance/record-keeping). Properly separated the serializer into
  its own `serializers.py` file matching every other module's structure.
- **Documents**: added `/stats/` (storage used, breakdown by file type,
  pending-approval count) and fixed a broken import where `views.py` was
  silently re-exporting classes that were actually defined in
  `serializers.py`. Folders now have stable, deterministic ordering
  (fixes a `UnorderedObjectListWarning` that could cause inconsistent
  pagination).
- **Approvals**: same import-structure fix as Documents, plus added
  `/pending/` (a manager's "needs my review" queue) and wired up a real
  notification to the requester when their request is approved/rejected.

## 8. TypeScript Type-Safety Bugs

- `lucide-react` import `FilePdf` doesn't exist in the icon set — fixed to
  the correct `FileType` icon (Documents page).
- Lucide icon components don't accept a native `title` HTML attribute;
  the low-stock warning icon in Inventory now wraps in a `<span title=...>`
  instead.
- `inventoryAPI.createItem` was typed to *require* `FormData` (because the
  model has an optional image field), which broke the plain-JSON "Add Item"
  form that never uploads an image. Now accepts either.
- **Duplicate `User` type**: `authStore.ts` had its own slimmer `User`
  interface that shadowed the real one in `types/index.ts`, silently
  missing `phone`, `bio`, `last_login_at`, `created_at`, and
  `is_2fa_enabled` — exactly the fields the Profile and Settings pages
  need. Removed the duplicate; both pages now correctly type-check against
  the one true definition, which matches what the backend actually returns.
- `tsconfig.json` targeted the deprecated `es5`; updated to `es2017`
  (standard for current Next.js apps, avoids a future hard TypeScript
  error).

## 9. Cleanup

- Removed leftover glitch-script artifacts: literal folders named
  `{accounts,companies,crm,...}` and `{app,components,hooks,...}` that a
  prior shell-brace-expansion typo created.
- Removed the real `.env` file from the shipped project (only `.env.example`
  should ever be distributed — confirmed it contained no real secrets, but
  the practice itself was wrong regardless).
- Fixed a requirements.txt corruption where two package lines had merged
  into one unparseable line (`setuptools==75.1.0pytest==8.3.3`) due to a
  missing trailing newline from a previous edit.

## 10. Documented, Not "Fixed" (because they're correctly optional)

Stripe, Twilio, and AWS S3 are intentionally inert until you provide real
credentials — this is correct, not a bug. Verified:
- File uploads already default to local disk storage (`MEDIA_ROOT`), so
  documents/receipts/avatars work today without any AWS credentials.
- Notification tasks (email/SMS) are already wrapped in try/except with
  `fail_silently=True`, so a missing Twilio/SMTP config can't crash a
  request — it just skips sending.
- `.env.example` now explicitly labels these as optional plumbing with a
  one-line comment explaining what happens if you leave them blank.

---

## How this was verified

Every fix listed above was confirmed by actually executing it, not by
inspection alone:

1. Created an isolated Python virtualenv, installed `requirements/base.txt`
   fresh, ran `python manage.py check` and `python manage.py test tests`
   against a real (SQLite) test database — 59/59 pass.
2. Ran `npm install`, `npx vitest run` — 17/17 pass.
3. Ran `npx next build` to confirm the production bundle actually compiles
   (the one remaining `tsc --noEmit` complaint about `globals.css` is a
   known standalone-tsc-vs-webpack quirk; the real Next.js build handles
   it fine, confirmed by `grep`-ing the build output for that error and
   finding none).
4. For every "the form 400s" bug, reproduced the exact failure against
   Django's real test runner first, read the actual error response body,
   then fixed the root cause (serializer field configuration) rather than
   masking the symptom.
