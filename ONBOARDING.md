# Onboarding: Graduate (in SearchNEU)

For new devs joining the Graduate team. Read this once end to end before your
first ticket. It assumes no prior knowledge of this repo.

Everything below was verified against `main` as of the latest commit.

---

## 1. What Graduate is

Graduate (formerly GraduateNU, a separate app) is the **degree-planning** half
of SearchNEU. A student builds a multi-year plan: years → terms → courses,
dragged around a grid, checked against their major/minor requirements.

It lives at `/graduate` inside the main Next.js app. It is **not** a separate
deployable — it shares auth, the database, and the course catalog with the rest
of search.

Two modes:

| Mode      | Route                | Storage                                   |
| --------- | -------------------- | ----------------------------------------- |
| Signed in | `/graduate/[planId]` | Postgres (`audit_plans`)                  |
| Guest     | `/graduate/guest`    | `localStorage` under the `guest-plan` key |

> **Naming:** the product is "Graduate", but the code says **audit** almost
> everywhere (`audit_plans`, `AuditCourse`, `/api/audit/...`, `auditUtils`).
> Treat "audit" and "graduate plan" as synonyms. This is a historical artifact;
> don't try to rename it in a drive-by PR.

---

## 2. Getting it running

Standard repo bootstrap first (from the repo root):

```bash
pnpm install && pnpm turbo setup && pnpm turbo dev
```

That gets you the app on `http://localhost:3000`. **Graduate will 404 at this
point.** There are two extra steps nobody documents, and both bite every new
dev:

### 2a. The feature flag is off

`/graduate` is gated behind a flag that is hardcoded `false`:

```ts
// apps/searchneu/lib/flags.ts
export const graduateFlag = flag({
  key: "graduate",
  description: "Enable graduate page",
  decide() {
    return false;
  },
});
```

`apps/searchneu/app/graduate/layout.tsx` calls `notFound()` when it resolves
false, so you get a 404, not an error — which looks like a broken route.

To develop locally, either flip `decide()` to `true` temporarily (**do not
commit that**) or override the flag through the Vercel Toolbar. Note
`FLAGS_SECRET` is **not** in `apps/searchneu/.env.example`, so the toolbar path
needs extra setup.

### 2b. Majors and minors are not seeded

`turbo setup` seeds nothing for Graduate. The New Plan modal reads from the
`catalog_majors` / `catalog_minors` tables, which come from a **separate repo**,
`major-scraper`:

```bash
pnpm turbo cli -- tools populate-catalog --scraperPath ~/projects/major-scraper
```

Until you run that, the New Plan modal renders with an empty major list and you
cannot create a plan at all.

> The docstring in `apps/cli/src/tools/populate-catalog.ts` says
> `~/Documents/major-scraper` and `pnpm run cli ...`. Both are wrong — the repo
> lives under `~/projects/` and the invocation is `turbo cli -- ...`.

**This is per-developer, not shared.** `DATABASE_URL` points at
`db.localtest.me:4444`, which is the Neon HTTP proxy in front of the Postgres
container defined in `compose.yaml`. That data lives in the `db_data` Docker
volume **on your own machine**. So:

- Every dev runs `populate-catalog` once, against their own local Postgres.
- It survives `docker compose down` and machine restarts (it's a named volume),
  so it really is once — not once per session.
- `docker compose down -v` destroys it and you re-run.
- It only writes somewhere shared if you deliberately point `DATABASE_URL` at a
  Neon branch first — the tool just writes to whatever `DATABASE_URL` says.

If we want to stop making everyone scrape, the fix is to publish a dump of
`catalog_majors` / `catalog_minors` and have `turbo setup` restore it. That
doesn't exist today.

Course names/credits come from the Banner scrape, which is also not seeded by
default (see the root `AGENTS.md`). Graduate works without it; courses just show
without friendly names.

### 2c. Two failure modes that look like broken code

Both of these hit this machine in Sept 2026 and neither is your fault:

**The Neon proxy's TLS cert expires.** `compose.yaml` pins
`ghcr.io/timowilhelm/local-neon-http-proxy:main`. The image ships a cert valid
for about a year from its build date, and `:main` is a moving tag — so a cached
image quietly goes stale. When it expires, _every_ DB query from the app fails:

```
NeonDbError: Server error (HTTP status 502)
# proxy logs: x509: certificate has expired or is not yet valid
```

Every page that touches the database 500s, while `docker exec ... psql` and
`turbo db:migrate` both keep working — migrations use a direct `localhost:5432`
URL that bypasses the proxy entirely. That split is what makes it confusing.

Fix:

```bash
docker compose pull neon-proxy && docker compose up -d --force-recreate --wait neon-proxy
```

**A stale process on port 3001 kills the whole dev environment.** `turbo dev`
runs every app's `dev` task as one unit. If an orphaned docs server is still
holding 3001, `@sneu/docs` dies with `EADDRINUSE` and **turbo tears down the run
with it** — including `@sneu/searchneu`, which never gets to start. The error
you see names `docs`, so it's easy to assume the main app is fine.

```bash
lsof -nP -iTCP:3001 -sTCP:LISTEN     # find it
kill <pid>
```

---

## 3. Where the code lives

```
apps/searchneu/
├── app/graduate/
│   ├── layout.tsx              # header + feature-flag gate
│   ├── page.tsx                # signed-in: redirect to newest plan; logged-out: guest view
│   ├── guest/page.tsx          # explicit guest view
│   └── [planId]/page.tsx       # the real plan page (server component, does all hydration)
│
├── app/api/audit/plan/
│   ├── route.ts                # POST create, GET list
│   ├── [id]/route.ts           # GET / PATCH / DELETE one plan
│   └── [id]/schedule/route.ts  # PATCH (schedule only)
│
├── components/graduate/
│   ├── BasePlanClient.tsx      # ★ the core: dnd grid + sidebar, shared by both modes
│   ├── PlanClient.tsx          # signed-in wrapper → persists via fetch()
│   ├── GuestPlanClient.tsx     # guest wrapper → persists via localStorage
│   ├── HeaderClient.tsx / GuestHeaderClient.tsx
│   ├── dnd/                    # AuditYearRow, AuditTermColumn, AuditCourseCard
│   ├── sidebar/                # requirements sidebar + whiteboard sidebar
│   └── modal/                  # NewPlan (736 ln), EditPlan (583 ln), AuditAddCourses (652 ln)
│
└── lib/
    ├── graduate/
    │   ├── types.ts            # ★ the domain model (469 ln) — read this first
    │   ├── api-dtos.ts         # Zod request schemas (+ tests)
    │   ├── requirementUtils.ts # requirement-tree matching + whiteboard (+ tests)
    │   ├── planUtils.ts        # dnd id assignment, year/course mutations
    │   ├── auditUtils.ts       # small shared display helpers
    │   ├── auditPlanUtils.ts   # empty schedule + template → schedule
    │   ├── useGraduateApi.ts   # client fetch hooks for majors/minors/templates
    │   ├── useLocalStorage.ts  # guest persistence
    │   └── actions.ts          # server action: delete plan
    ├── dal/audits.ts           # ★ all plan DB access + validation
    ├── dal/catalog.ts          # majors / minors / templates reads
    ├── controllers/majors.ts   # major/minor/concentration validation
    └── api/withAuth.ts         # auth wrapper for route handlers

packages/db/src/schema/graduate.ts   # audit_plans, audit_metadata
```

**Start with `lib/graduate/types.ts`, then `components/graduate/BasePlanClient.tsx`,
then `lib/dal/audits.ts`.** That's ~80% of the mental model.

---

## 4. The data model

### The schedule tree

```
Audit
└── years: AuditYear[]
    ├── year: number        # academic year 1..N, NOT a calendar year
    ├── fall / spring / summer1 / summer2: AuditTerm
    │   ├── season: SeasonEnum   (FL | SP | S1 | S2 | SM)
    │   ├── status: StatusEnum   (COOP | CLASSES | INACTIVE | ...)
    │   └── classes: AuditCourse[]
    └── isSummerFull: boolean
```

`AuditCourse.id` is **bookkeeping for drag-and-drop only**. It is assigned on
load (`assignDndIds`) and stripped before every save (`stripDndIds`). It is
never meaningful data — don't persist it, don't key off it.

### The requirement tree

A `Major`/`Minor` has `requirementSections: Section[]`. Each `Section` holds a
recursive `Requirement` union:

- `COURSE` — a specific course
- `AND` / `OR` — all / any of a list
- `XOM` — "X credits from many" of a list
- `RANGE` — any course in `SUBJECT idRangeStart..idRangeEnd`, minus exceptions
- `SECTION` — nested section

`lib/graduate/requirementUtils.ts` walks this tree to decide what's satisfied.

### The whiteboard

A manual override layer on top of the automatic matching — the student decides
which course counts for which requirement section:

```ts
type Whiteboard = Record<
  SectionTitle,
  { courses: string[]; status: WhiteboardStatus }
>;
```

Keyed by **section title string**. That means renaming a section in the scraper
silently orphans every student's whiteboard entry for it. Keep that in mind
before touching scraper output.

### Database

Two tables in `packages/db/src/schema/graduate.ts`:

- `audit_plans` — one row per plan. `schedule` and `whiteboard` are untyped
  `json()` columns; the TS types are asserted on read, not validated.
- `audit_metadata` — per-user profile (catalog year, co-op cycle, completed and
  transferred courses, primary/starred plan). **Currently written by nothing in
  the app** — it's scaffolding for a feature that was never finished.

---

## 5. How a plan loads and saves

**Load** (`app/graduate/[planId]/page.tsx` — server component):

1. Auth check → redirect to `/` if no session.
2. `getAuditPlan(id, userId)` — scoped by `userId`, so a wrong id is a 404, not
   a leak.
3. `hydratePlan()` — the interesting part. The DB row stores only
   `subject`/`classId` per course. Hydration batch-fetches names, NUPaths,
   credits, prereqs and coreqs and merges them in, so the client never has to
   fetch course metadata.
4. Renders `HeaderClient` + `PlanClient`.

**Save** — there is no save button. Every mutation persists immediately:

```
BasePlanClient (local state, immer)
   └─ persist() ──> onPersistSchedule(stripped, prunedWhiteboard)
                      ├─ PlanClient       → PATCH /api/audit/plan/[id]
                      └─ GuestPlanClient  → localStorage
```

`BasePlanClient` is mode-agnostic on purpose: it takes `onPersistSchedule` /
`onPersistWhiteboard` callbacks and knows nothing about auth. **Keep it that
way** — if you find yourself adding an `isGuest` prop to it, push the branch up
into the wrapper instead.

Server-side validation lives in `lib/dal/audits.ts`, not in the route handlers.
Routes only parse the Zod DTO and delegate.

---

## 6. Conventions and traps

**Course keys have three incompatible formats.** This is the single most common
source of "why doesn't my lookup work":

| Format            | Example   | Used by                                        |
| ----------------- | --------- | ---------------------------------------------- |
| `SUBJECT-CLASSID` | `CS-2500` | `courseNames` / `courseDetails` hydration maps |
| `SUBJECT CLASSID` | `CS 2500` | whiteboard keys, all of `requirementUtils`     |
| `SUBJECTCLASSID`  | `CS2500`  | `courseToString()`, display only               |

Always check which one the function you're calling expects.

**Other things to know:**

- Client fetching: the repo standard is **SWR**, but `useGraduateApi.ts`
  predates that and hand-rolls `useState`/`useEffect`. New hooks should use SWR.
- UI components: **Base UI** only. Radix was removed; don't reintroduce it.
- Immutable updates go through **immer** (`produce`), already a dependency.
- `lib/dal/audits.ts` returns `null` for both "not found" and "validation
  failed", and routes turn any `null` into a `400`. Debug with the server
  console — the reason is `console.debug`'d, not returned.
- `withAuth` catches every throw and returns `400` with the raw error message.
  Don't rely on specific status codes from these routes.

---

## 7. Known issues

These are real and currently on `main`. Good first tickets are marked ★.

**Correctness**

1. **Multi-major is fake.** The DB column is an array, the modal is a
   multi-select with chips, but ~14 call sites do `majors[0]` and
   `getByMajorAndYear()` returns `majors[0] ?? null`. A student can select two
   majors; only the first ever affects requirements, templates, or validation.
   Either finish it or restrict the UI to one.
2. **Changing your major leaves a stale whiteboard.** `updateAuditPlan()` does
   `whiteboard: newWhiteboard ?? currentAuditPlan.whiteboard` — it never rebuilds
   from the new major's sections, so entries keyed by the old major's section
   titles persist and orphan.
3. ★ **`/graduate` and `/graduate/guest` behave differently when logged out.**
   `app/graduate/page.tsx` fetches `majors`/`minors`, uses them only to collect
   course-name keys, then drops them — it never passes `initialMajors`/
   `initialMinors` to `GuestPlanClient`, while `guest/page.tsx` does. Result: no
   requirements sidebar on one of the two routes.
4. **XOM credit counting assumes 4 credits per course.**
   `getRequirementCredits()` in `requirementUtils.ts` hardcodes `4`, so
   "X credits from many" mis-counts 1-credit labs and 2-credit seminars. Real
   credit data is already available on the hydrated course.

**Repo health**

5. ★ **CI never typechecks.** `.github/workflows/ci.yaml` runs format, lint and
   test only — no `tsc --noEmit`, no `build`. Type errors can and do land on
   `main`.
6. **CI runs the wrong Node.** Root `package.json` declares
   `engines.node: "26.x"`; CI pins `node-version: 24.16.0`.
7. ★ **`turbo.json` has duplicate keys.** `dev` and `test` are each defined
   twice; the later definition silently wins. Also `$schema` still points at
   `v2-8-0` while turbo is on `2.9.16`.
8. ★ **Debug logging ships to production.** `auditPlanUtils.ts` `console.log`s
   every course added plus the entire final schedule; `useGraduateApi.ts` has a
   `console.log` in an error path.
9. **`@sneu/scraper` has a `test` script but zero tests** (`ℹ tests 0`).
10. ★ **`turbo dev` is all-or-nothing.** One app failing to boot kills every
    other dev server in the run (see §2c). Worth making `docs` non-fatal, or
    giving it a `--port` fallback.
11. **The neon-proxy image tag is unpinned and its cert expires** (see §2c).
    Pinning a digest would make it reproducible but would _guarantee_ expiry;
    the better fix is a `setup` preflight that checks the cert and tells you to
    re-pull.
12. **`DEFAULT_CATALOG_YEAR = 2026`** (`lib/graduate/types.ts`) but the seeded
    catalog only covers **2021–2025** locally. Worth confirming prod has 2026
    data before trusting that fallback.

**Documentation**

13. **The docs site has no Graduate page at all.** `apps/docs/content/dev/`
    covers database, frontend, search and Vercel — nothing on Graduate, and
    `/api/audit/*` is absent from `searchneu-api.yaml`.
14. **`apps/docs/content/dev/codebase/overview.md` is stale** — it never mentions
    `apps/cli` or `packages/notifs`, and it lists `/notifs` as a `@sneu/scraper`
    export. The root `AGENTS.md` also omits `packages/notifs`.

**Design debt (discuss before acting)**

15. `verifyUser()` — the shared auth helper for the whole app, including four
    scheduler routes — lives in `lib/dal/audits.ts`. It belongs in `lib/auth/`.
16. `collectCourseKeys()` is copy-pasted three times across the two guest pages
    and `[planId]/page.tsx`.
17. `audit_metadata` is unused (see §4).
18. The three modals are 736 / 652 / 583 lines. `NewPlanModal` and
    `EditPlanModal` share most of their major/minor/concentration form logic.

---

## 8. Shipping a change

```bash
pnpm format          # prettier write
pnpm turbo lint
pnpm turbo test
```

CI runs format-check, lint and test. It does **not** typecheck, so run this
yourself before pushing:

```bash
pnpm --filter @sneu/searchneu exec tsc --noEmit
```

Repo rules worth knowing:

- **Linear history is enforced.** No merge commits — `git rebase origin/main`.
  A maintainer can override by commenting `/allow-merges` on the PR.
- **Migrations must be backward compatible.** Production migrations run from a
  separate workflow that is _not_ ordered against the Vercel deploy, so use
  expand/contract: add first, deploy tolerant code, drop in a later release.
- Schema changes: edit `packages/db/src/schema/`, then `pnpm turbo db:generate`,
  then `pnpm turbo db:migrate`. Don't hand-write SQL in `packages/db/drizzle/`.

---

## 9. First week

1. Get Graduate rendering locally — flag on, `populate-catalog` run, a plan
   created. If you can drag a course between terms and see it survive a reload,
   your environment is correct.
2. Read `types.ts` → `BasePlanClient.tsx` → `dal/audits.ts`.
3. Pick a ★ issue from §7.
4. Skim the proposals in `apps/docs/content/paperwork/proposals/` —
   `01-graduate-tables`, `11-graduate-whiteboard`, `13-graduate-catalog-tables`
   are the design history for everything above.
