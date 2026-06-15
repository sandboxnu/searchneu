# @sneu/searchneu

The main fullstack Next.js (App Router) web app; runs on http://localhost:3000.

- Routes live in `app/`, shared React components in `components/`, and backend /
  general logic in `lib/`. `scripts/` is deprecated — do not add to it.
- UI is built with Base UI + Tailwind CSS v4. Do not reintroduce Radix.
- Search uses Minisearch; data access uses Drizzle via `@sneu/db`.
- `pnpm test` runs `node --test` over `**/*.test.ts` (via tsx).
