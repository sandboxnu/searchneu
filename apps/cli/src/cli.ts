/**
 * SearchNEU Scraper CLI — single entry point.
 *
 * Usage:
 *   pnpm run cli generate [options]
 *   pnpm run cli upload [options]
 *   pnpm run cli tools <subcommand> [options]
 */

import { defineCommand, runMain } from "citty";

const tools = defineCommand({
  meta: {
    name: "tools",
    description: "config management and validation tools",
  },
  subCommands: {
    "seed-config": import("./tools/seed-config").then((m) => m.default),
    "expire-terms": import("./tools/expire-terms").then((m) => m.default),
    "check-config": import("./tools/check-config").then((m) => m.default),
    "sync-db": import("./tools/sync-db").then((m) => m.default),
    "update-cache": import("./tools/update-cache").then((m) => m.default),
    "backup-db": import("./tools/backup-db").then((m) => m.default),
    "migrate-trackers": import("./tools/migrate-trackers").then(
      (m) => m.default,
    ),
  },
});

const main = defineCommand({
  meta: {
    name: "cli",
    description: "SearchNEU CLI",
  },
  subCommands: {
    generate: () => import("./commands/generate").then((m) => m.default),
    upload: () => import("./commands/upload").then((m) => m.default),
    tools,
  },
});

void runMain(main);
