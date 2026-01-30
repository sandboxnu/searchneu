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

View the README files in the desired application for quickstart instructions.

## BEATS

![Alt](https://repobeats.axiom.co/api/embed/017df9a65bbbab6d89b0d505d6e761ff648392f4.svg "repobeats")
