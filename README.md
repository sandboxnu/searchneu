```txt
                              ▄▄
                              ██
▄█▀▀▀ ▄█▀█▄  ▀▀█▄ ████▄ ▄████ ████▄ ████▄ ▄█▀█▄ ██ ██
▀███▄ ██▄█▀ ▄█▀██ ██ ▀▀ ██    ██ ██ ██ ██ ██▄█▀ ██ ██
▄▄▄█▀ ▀█▄▄▄ ▀█▄██ ██    ▀████ ██ ██ ██ ██ ▀█▄▄▄ ▀██▀█
```

[searchneu](https://searchneu.com) | [docs](coming soon) | [sandbox](https://sandboxnu.com)

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
│  ├─ tsconfig/     combined typescript configuration
│  └─ notifs/       centralized notifier
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

TODO

## quickstart

Make sure [Docker](https://www.docker.com/) is installed and running, then:

```sh
pnpm install   # install dependencies (pnpm is the package manager)
turbo setup    # creates .env files, starts the database, runs migrations
turbo dev      # start the dev servers (app on http://localhost:3000)
```

Apart from `pnpm install`, every workflow runs through turbo. `turbo setup` is
idempotent — re-run it any time (e.g. after restarting Docker).

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
