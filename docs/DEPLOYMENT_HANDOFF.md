# DDS Member Site Handoff

## Overview

- Workspace root: `/Users/nagasawariku/Library/CloudStorage/GoogleDrive-rikunagasawa0619@gmail.com/マイドライブ/claude code/Codex`
- Stack: `Next.js 16 App Router`, `TypeScript`, `Tailwind v4`, `Clerk`, `Prisma`, `Postgres`, `Vitest`
- Current status:
  - Member portal implemented
  - Admin portal implemented
  - Prisma schema implemented
  - Seed script implemented
  - Demo fallback works when DB / Clerk are not configured
  - CRUD is partially wired for production use
- Build, lint, test currently pass locally
  - Initial Prisma migration exists under `prisma/migrations`

## What Exists Already

- Member routes:
  - `/login`
  - `/app`
  - `/app/deals`
  - `/app/events`
  - `/app/tools`
  - `/app/bookings`
  - `/app/courses`
  - `/app/courses/[courseSlug]`
  - `/app/courses/[courseSlug]/[lessonSlug]`
  - `/app/faq`
- Admin routes:
  - `/admin`
  - `/admin/members`
  - `/admin/plans`
  - `/admin/content`
  - `/admin/offerings`
  - `/admin/theme`
  - `/admin/campaigns`
  - `/admin/audit-logs`
  - `/admin/exports`
- Server actions already implemented for:
  - member creation
  - Clerk invitation on member creation
  - plan update
  - credit adjustment
  - monthly credit grant batch
  - theme save
  - banner create
  - announcement create
  - offering create
  - reservation attendance / no-show processing
  - booking apply
  - reservation cancel
  - lesson completion
  - profile update

## Primary Goal

Take this codebase from "working locally" to "production-ready and deployed", while also reviewing:

- security issues
- logic bugs
- data integrity issues
- auth / authorization gaps
- DX / deployment risks
- better implementation options if they materially improve safety or maintainability

## Required Review Scope

Before deploying, review and fix:

1. Authentication and authorization
2. Server action validation
3. Credit and reservation integrity
4. Prisma schema correctness
5. Seed safety for production vs staging
6. Clerk integration assumptions
7. Missing admin protections
8. Any XSS / unsafe HTML / unsafe user input handling
9. Any race conditions in booking / waitlist logic
10. Any deployment/runtime issues on Vercel

## Known Important Files

- App and routes:
  - `src/app`
- Server actions:
  - `src/actions/admin.ts`
  - `src/actions/member.ts`
  - `src/actions/auth.ts`
- Core logic:
  - `src/lib/auth.ts`
  - `src/lib/repository.ts`
  - `src/lib/credits.ts`
  - `src/lib/reservations.ts`
  - `src/lib/access.ts`
  - `src/lib/portal.ts`
- Data model:
  - `prisma/schema.prisma`
  - `prisma/seed.ts`
- Setup:
  - `package.json`
  - `.env.example`
  - `README.md`

## Deployment Tasks

1. Validate the current implementation and identify bugs / risks first.
2. Fix all blocking issues required for production deployment.
3. Ensure Clerk works correctly in production:
   - sign-in
   - role-based redirect
   - admin protection
   - user lookup / provisioning assumptions
4. Ensure Prisma and Postgres are production-safe:
   - connection handling
   - schema correctness
   - seed behavior
   - idempotent setup where appropriate
   - migration deployment via `prisma migrate deploy`
5. Ensure booking / waitlist / credits behave safely under concurrent requests.
6. Review whether current server actions need:
   - stricter authorization
   - CSRF considerations
   - duplicate submission protection
   - transactional guarantees
7. Prepare deployment configuration for Vercel.
8. Deploy the app.
9. Verify production flows end-to-end.
10. Document:
   - environment variables actually used
   - deployment steps performed
   - any remaining risks

## Acceptance Criteria

- Production deployment is live and accessible
- Admin routes are protected correctly
- Student routes are protected correctly
- Clerk sign-in works in production
- Prisma DB is connected and seeded
- Admin can:
  - create member
  - send Clerk invitation
  - change plan
  - adjust credits
  - run monthly credit grant batch
  - create banner
  - create announcement
  - create offering
  - mark attendance / no-show for ON_ATTEND offerings
  - save theme settings
  - export CSV
  - review audit logs
- Student can:
  - sign in
  - see only allowed content
  - book an offering
  - cancel within policy
  - see credit balance change correctly
  - mark lesson complete
  - update profile
- No failing `lint`, `test`, or `build`
- Security / bug review findings are explicitly reported

## Important Constraints

- Do not remove the demo fallback unless replacing it with a clearly better safe dev workflow.
- Preserve the existing product shape unless there is a strong reason to change it.
- If changing schema or business rules, explain why.
- If there are high-risk bugs, fix them before deploying.
- Prefer correctness over speed for booking / credit logic.

## Suggested Review Questions

- Can a non-admin trigger admin actions?
- Can duplicate booking or credit consumption happen under concurrency?
- Can a user access content outside their plan due to fallback logic?
- Are there unsafe assumptions when Clerk user exists but DB user does not?
- Are there seed behaviors that could be dangerous in production?
- Is `custom_html` rendering currently acceptable for production?
- Are there missing indexes / constraints for reservation and credit integrity?
- Are public legal routes, health checks, and cron endpoints reachable when Clerk middleware is enabled?

## Suggested Deliverables

- deployed URL
- list of fixes made
- list of security / bug findings
- remaining risks
- exact env vars required
- exact deploy commands / steps used

## Notes For The Deploying Agent

- Start with code review and risk review, not immediate deployment.
- Treat this as production-hardening, not just shipping.
- If a better architecture is clearly warranted for auth, booking integrity, or admin safety, propose it and implement it if it is still practical within this codebase.

## Handoff Prompt

Use the prompt below as-is or with small edits:

```text
You are taking over a Next.js + Prisma + Clerk codebase and your job is to bring it to production readiness and deploy it.

Workspace root:
/Users/nagasawariku/Library/CloudStorage/GoogleDrive-rikunagasawa0619@gmail.com/マイドライブ/claude code/Codex

First, do a serious engineering review before deploying. I want you to actively think about:
- vulnerabilities
- authorization flaws
- booking / waitlist race conditions
- credit accounting bugs
- Prisma schema problems
- deployment misconfigurations
- better implementation ideas if the current design is weak

Do not just deploy blindly.

Your required process:
1. Inspect the codebase and understand the architecture.
2. Identify production blockers, bugs, vulnerabilities, and weak design choices.
3. Fix the important ones directly in code.
4. Make the app production-ready on Vercel with Clerk + Postgres.
5. Seed the database appropriately.
6. Verify the app with lint, tests, build, and end-to-end checks.
7. Deploy it.
8. Report:
   - what you changed
   - what bugs / risks you found
   - what remains risky
   - deployed URL
   - required environment variables

Key files to inspect first:
- src/app
- src/actions/admin.ts
- src/actions/member.ts
- src/actions/auth.ts
- src/lib/auth.ts
- src/lib/repository.ts
- src/lib/credits.ts
- src/lib/reservations.ts
- prisma/schema.prisma
- prisma/seed.ts
- README.md
- docs/DEPLOYMENT_HANDOFF.md

Constraints:
- Preserve the current DDS product shape unless there is a strong reason to change it.
- Prioritize correctness and security over speed.
- If you find a better approach, explain it and implement it if practical.
```
