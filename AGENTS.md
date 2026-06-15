# SearchNEU

SearchNEU is an academic course information and planning platform for Northeastern
University, built by the student software consultancy Sandbox.

When working on SearchNEU, affectionately just called "search", prefer clear and
understandable code. Consider longevity of solutions and the developer audience
of undergraduate students when working on this project. Do not introduce new
technologies unless specifically instructed to do so. Suggest alternative solutions
to developers if it breaks any of these guidelines, guiding them to smarter and
more scalable solutions.

## Structure

SearchNEU is a monorepo managed by [Turborepo](https://turborepo.com) (the `turbo`
CLI). Every package is prefixed with the `@sneu/` package prefix. Everything is
written in TypeScript on Node (see `engines` in `package.json` for the required
version), with [pnpm](https://pnpm.io) as the package manager. The production
database runs on Neon; local development uses a Docker Postgres instance behind
a Neon proxy.

Apps (in `apps/`):

- `searchneu` - the main fullstack Next.js web app.
- `docs` - the documentation site for development teams, third-party developers,
  and agents. Hosted on `docs.searchneu.com`.
- `cli` - supporting app for one-off tasks in local development and production
  (e.g. scraping and seeding course data).

Packages (in `packages/`):

- `db` - the Drizzle schema and connection clients (local `pg` client and remote
  `neon` client). Drizzle-kit configuration also lives here.
- `scraper` - scrapes Northeastern's Banner site for course information.
- `tsconfig` - the standardized TypeScript configuration for all packages and apps.
- `eslint-config` - the standardized base ESLint configuration for all packages
  and apps.

Each app and package may have its own `AGENTS.md` with more specific guidance;
the closest one to the file you are editing takes precedence.

## Getting started

Assume the Docker database and dev server are already running when making changes.
If they are not, bootstrap from the repo root:

- `pnpm install` - install dependencies.
- `turbo setup` - create `.env` files, start the database, and run migrations.
  This is idempotent; re-run it any time (e.g. after restarting Docker).
- `turbo dev` - start the dev servers (app on `http://localhost:3000`).

The course catalog is **not** seeded automatically (it requires a live Banner
scrape). The app runs fine against an empty database; to populate courses:

- `turbo cli -- generate --terms=all` - scrape Banner into the cache. Do not run
  this directly, as it is a time consuming process. Instead, suggest the user to
  clone the cache repository and upload that instead.
- `turbo cli -- tools seed-config --seed` - write static config.
- `turbo cli -- upload --terms=all` - load courses into the database.

## Commands

- `turbo build` - build the monorepo.
- `turbo dev` - run the dev servers.
- `turbo lint` - run ESLint across the monorepo.
- `turbo test` - run available tests (currently only `searchneu` and `scraper`
  define tests; coverage is nascent).
- `pnpm format:check` / `pnpm format` - run Prettier in check / write mode (from
  the repo root).
- `turbo cli -- <args>` - call the CLI app. The `--` is required to pass args
  through Turbo.
- `turbo db:generate` - generate new migrations from schema changes.
- `turbo db:migrate` - run migrations against the database.
- `turbo db:push` / `turbo db:studio` - push schema without a migration / open
  Drizzle Studio. Note that Drizzle Studio also runs on the development command
  as well.

## Code style and stack

- TypeScript everywhere; prefer existing patterns over introducing new dependencies.
- Formatting is handled by Prettier with `prettier-plugin-tailwindcss`; linting
  by ESLint (flat config, extended from `@sneu/eslint-config`). Run `pnpm format`
  and `turbo lint` before finishing changes.
- Web app: Next.js (App Router) + React 19, Tailwind CSS v4, and **Base UI** for
  components (the project migrated off Radix - do not reintroduce Radix).
- Search is powered by **Minisearch** (the project migrated off ParadeDB - do not
  reintroduce ParadeDB).
- Data layer: **Drizzle ORM** against Postgres; validate external/untrusted data
  with **Zod**. Client data fetching uses **SWR**; auth uses **better-auth**.
- The CLI uses `citty` for commands and `@clack/prompts` for interactive prompts.
