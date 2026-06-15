```txt
                              ▄▄
                              ██
▄█▀▀▀ ▄█▀█▄  ▀▀█▄ ████▄ ▄████ ████▄ ████▄ ▄█▀█▄ ██ ██
▀███▄ ██▄█▀ ▄█▀██ ██ ▀▀ ██    ██ ██ ██ ██ ██▄█▀ ██ ██
▄▄▄█▀ ▀█▄▄▄ ▀█▄██ ██    ▀████ ██ ██ ██ ██ ▀█▄▄▄ ▀██▀█
```

[searchneu](https://searchneu.com) | [docs](https://docs.searchneu.com) | [sandbox](https://sandboxnu.com)

## 🚀 about

SearchNEU is the premier course information platform for Northeastern University.

## project structure

The SearchNEU codebase is organized in a monorepo structure

```txt
searchneu/
├─ apps/
│  ├─ searchneu/    the main application
│  └─ docs/         documentation site
├─ packages/
│  ├─ db/           database schema
│  ├─ scraper/      scraper scripts and logic
│  └─ tsconfig/     combined typescript configuration
├─ compose.yaml     docker compose spec
├─ package.json
├─ turbo.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ LICENSE
└─ README.md
```

The [Turborepo](https://turborepo.com/) build system is used in order to manage
packages and applications across the monorepo with the [pnpm](https://pnpm.io/)
package management system.

## technology

SearchNEU is a TypeScript monorepo built on [Turborepo](https://turborepo.com/)
and [pnpm](https://pnpm.io/) workspaces, running on Node (see `engines` in
`package.json`).

### Web app (`apps/searchneu`)

- [Next.js](https://nextjs.org/) (App Router) with [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) for styling, with
  [Base UI](https://base-ui.com/) for accessible component primitives
- [Minisearch](https://github.com/lucaong/minisearch) for client-side course search
- [SWR](https://swr.vercel.app/) for data fetching and
  [better-auth](https://www.better-auth.com/) for authentication
- [Twilio](https://www.twilio.com/) for SMS course notifications

### Data layer (`packages/db`)

- [Drizzle ORM](https://orm.drizzle.team/) against PostgreSQL
- [Neon](https://neon.tech/) serverless Postgres in production; a Docker Postgres
  instance behind a Neon proxy for local development
- [Zod](https://zod.dev/) for validating external and untrusted data

### Tooling

- [TypeScript](https://www.typescriptlang.org/) everywhere, with shared configs
  in `packages/tsconfig`
- [ESLint](https://eslint.org/) (flat config from `packages/eslint-config`) and
  [Prettier](https://prettier.io/) with `prettier-plugin-tailwindcss`
- [Docs](https://docs.searchneu.com) built with [Fumadocs](https://fumadocs.dev/)

## quickstart

Make sure [Docker](https://www.docker.com/) is installed and running, then:

```sh
pnpm install   # install dependencies (pnpm is the package manager)
turbo setup    # creates .env files, starts the database, runs migrations
turbo dev      # start the dev servers (app on http://localhost:3000)
```

Apart from `pnpm install`, every workflow runs through turbo. `turbo setup` is
idempotent - re-run it any time (e.g. after restarting Docker).

Course catalog data is **not** seeded automatically (it requires a live Banner
scrape). The app runs fine against an empty database; to populate courses:

```sh
turbo cli -- generate --terms=all        # scrape Banner -> cache
turbo cli -- tools seed-config --seed     # write static config
turbo cli -- upload --terms=all           # load into the database
```

For app-specific details, see the README in each application under `apps/`.

## BEATS

![Alt](https://repobeats.axiom.co/api/embed/017df9a65bbbab6d89b0d505d6e761ff648392f4.svg "repobeats")
