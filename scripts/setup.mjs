#!/usr/bin/env node
// @ts-check
/**
 * One-shot, idempotent dev bootstrap.
 *
 * Codifies the known-good startup sequence so a fresh clone is ready to run
 * with a single command. Every step is safe to re-run:
 *   - .env files are only created when missing (never overwritten)
 *   - `docker compose --wait` no-ops when containers are already healthy
 *   - drizzle-kit skips migrations that have already been applied
 *
 * Usage: `pnpm setup`
 *
 * Catalog/course data is intentionally NOT seeded here (it requires a live
 * Banner scrape). The script prints the opt-in command at the end.
 */

import { spawnSync } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Direct TCP URL used by drizzle-kit migrations (bypasses the Neon proxy).
const MIGRATION_DATABASE_URL =
  "postgres://postgres:postgres@localhost:5432/main";

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

let step = 0;
const log = {
  step: (msg) => console.log(`\n${c.cyan}${c.bold}[${++step}] ${msg}${c.reset}`),
  info: (msg) => console.log(`    ${c.dim}${msg}${c.reset}`),
  ok: (msg) => console.log(`    ${c.green}✓ ${msg}${c.reset}`),
  warn: (msg) => console.log(`    ${c.yellow}! ${msg}${c.reset}`),
};

/** Run a command, inheriting stdio. Exits the process on failure. */
function run(cmd, args, { env, label } = {}) {
  log.info(`$ ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error(
      `\n${c.red}${c.bold}✗ ${label ?? cmd} failed${c.reset} ${c.dim}(exit ${
        result.status ?? "unknown"
      })${c.reset}`,
    );
    process.exit(result.status ?? 1);
  }
}

/** True if a command exists and returns exit code 0. */
function check(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

function ensureEnvFile(relDir) {
  const dir = path.join(root, relDir);
  const example = path.join(dir, ".env.example");
  const target = path.join(dir, ".env");
  if (!existsSync(example)) {
    log.warn(`${relDir}/.env.example not found, skipping`);
    return;
  }
  if (existsSync(target)) {
    log.ok(`${relDir}/.env already exists`);
    return;
  }
  copyFileSync(example, target);
  log.ok(`created ${relDir}/.env from .env.example`);
}

console.log(`${c.bold}sneu dev environment setup${c.reset}`);

// 1. Docker must be running before anything else.
log.step("Checking Docker");
if (!check("docker", ["info"])) {
  console.error(
    `\n${c.red}${c.bold}✗ Docker doesn't appear to be running.${c.reset}\n` +
      `    Start Docker Desktop (or your daemon) and re-run ${c.bold}pnpm setup${c.reset}.`,
  );
  process.exit(1);
}
log.ok("Docker is running");

// 2. Create local env files from the committed templates.
log.step("Setting up environment files");
ensureEnvFile("apps/searchneu");
ensureEnvFile("apps/cli");

// 3. Start Postgres + the Neon proxy and wait for the healthcheck to pass.
log.step("Starting database containers");
run("docker", ["compose", "up", "-d", "--wait"], { label: "docker compose" });
log.ok("Postgres + Neon proxy are healthy");

// 4. Build the workspace packages the app/migrations import from dist/.
log.step("Building workspace packages");
run(
  "pnpm",
  ["--filter", "@sneu/db", "--filter", "@sneu/scraper", "build"],
  { label: "pnpm build" },
);
log.ok("@sneu/db and @sneu/scraper built");

// 5. Apply database migrations (idempotent — drizzle skips applied ones).
//    Call the @sneu/db package script directly (drizzle-kit) rather than the
//    root `db:migrate`, which would invoke turbo recursively inside this task.
log.step("Running database migrations");
run("pnpm", ["--filter", "@sneu/db", "db:migrate"], {
  env: { DATABASE_URL: MIGRATION_DATABASE_URL },
  label: "db:migrate",
});
log.ok("Migrations applied");

// Done.
console.log(`\n${c.green}${c.bold}✓ Setup complete.${c.reset}\n`);
console.log(`${c.bold}Start the dev servers:${c.reset}`);
console.log(`  ${c.cyan}turbo dev${c.reset}`);
console.log(`\n${c.bold}Optional — load course catalog data${c.reset} ${c.dim}(requires a live Banner scrape):${c.reset}`);
console.log(`  ${c.cyan}turbo cli -- generate --terms=all${c.reset}`);
console.log(`  ${c.cyan}turbo cli -- tools seed-config --seed${c.reset}`);
console.log(`  ${c.cyan}turbo cli -- upload --terms=all${c.reset}`);
console.log("");
