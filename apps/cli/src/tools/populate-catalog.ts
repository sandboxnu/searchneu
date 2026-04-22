/**
 * CLI tool: populate-catalog
 *
 * Usage:
 *   # Run the scraper first, then insert into DB:
 *   pnpm run cli tools populate-catalog --scraperPath ~/Documents/major-scraper
 *
 *   # Skip scraping, just read existing output:
 *   pnpm run cli tools populate-catalog --scraperPath ~/Documents/major-scraper --skipScrape
 *
 *   # Scrape specific years with verbose output:
 *   pnpm run cli tools populate-catalog --scraperPath ~/Documents/major-scraper --years 2024,2025 -v
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { defineCommand } from "citty";
import { brandIntro, isVerbose, p, pc, setVerbosity } from "../ui";
import { getDb } from "@sneu/db/pg";
import { catalogMajorsT, catalogMinorsT } from "@sneu/db/schema";
import { chunk } from "../../../../packages/scraper/src/upload/types";
/**
 * Recursively find all files matching a given filename within a directory.
 */
function findFiles(dir: string, filename: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) {
    return results;
  }

  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findFiles(full, filename));
    } else if (entry === filename) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Extract year/college/name from a path like:
 *   .../degrees/major/{year}/{college}/{name}/parsed.initial.json
 */
function extractPathParts(filePath: string): {
  year: string;
  college: string;
  name: string;
} {
  const dir = path.dirname(filePath);
  const name = path.basename(dir);
  const college = path.basename(path.dirname(dir));
  const year = path.basename(path.dirname(path.dirname(dir)));
  return { year, college, name };
}

export default defineCommand({
  meta: {
    name: "populate-catalog",
    description:
      "populate catalog_majors and catalog_minors from scraper output",
  },
  args: {
    scraperPath: {
      type: "string",
      required: true,
      description: "path to the major-scraper repo",
    },
    years: {
      type: "string",
      default: "current",
      description: 'comma-separated years to scrape (default: "current")',
    },
    skipScrape: {
      type: "boolean",
      alias: "s",
      default: false,
      description: "skip running the scraper, just read existing output",
    },
    verbose: {
      alias: "v",
      type: "boolean",
      description: "show detailed output",
    },
  },
  async run({ args }) {
    setVerbosity({ verbose: args.verbose });
    brandIntro("tools populate-catalog");

    const scraperPath = path.resolve(args.scraperPath);

    // 1. Validate scraperPath
    if (
      !existsSync(scraperPath) ||
      !existsSync(path.join(scraperPath, "package.json"))
    ) {
      p.log.error(
        `Invalid scraper path: ${pc.dim(scraperPath)} (missing package.json)`,
      );
      process.exit(1);
    }
    p.log.info(`Scraper repo: ${pc.dim(scraperPath)}`);

    // 2. Run scraper unless --skip-scrape
    if (!args.skipScrape) {
      const cmd = `pnpm scrape:all ${args.years}`;
      p.log.info(`Running: ${pc.dim(cmd)}`);
      try {
        execSync(cmd, {
          cwd: scraperPath,
          stdio: "inherit",
        });
      } catch {
        p.log.error("Scraper failed — aborting.");
        process.exit(1);
      }
    } else {
      p.log.info("Skipping scraper run (--skip-scrape)");
    }

    const db = getDb(process.env.DATABASE_URL!, true);

    // 3. Process majors
    const majorDir = path.join(scraperPath, "degrees", "major");
    const majorFiles = findFiles(majorDir, "parsed.initial.json");
    p.log.info(`Found ${pc.bold(String(majorFiles.length))} major files`);

    const majorValues: (typeof catalogMajorsT.$inferInsert)[] = [];

    for (const file of majorFiles) {
      const raw = JSON.parse(readFileSync(file, "utf-8"));
      const { year, college, name } = extractPathParts(file);

      // Look for matching template
      const templatePath = path.join(
        scraperPath,
        "templates",
        year,
        college,
        name,
        "template.json",
      );
      let templateOptions: Record<string, unknown> = {};
      if (existsSync(templatePath)) {
        const templateRaw = JSON.parse(readFileSync(templatePath, "utf-8"));
        // Strip metadata fields, keep the rest
        const { ...rest } = templateRaw;
        templateOptions = rest;
        if (isVerbose()) {
          p.log.info(
            `  Template matched: ${pc.dim(`${year}/${college}/${name}`)}`,
          );
        }
      }

      majorValues.push({
        name: raw.name,
        totalCreditsRequired: raw.totalCreditsRequired,
        yearVersion: raw.yearVersion,
        requirementSections: raw.requirementSections,
        concentrationOptions: raw.concentrations?.concentrationOptions ?? [],
        minConcentrationOptions: raw.concentrations?.minOptions ?? 0,
        templateOptions,
      });

      if (isVerbose()) {
        p.log.info(`  Major: ${pc.dim(raw.name)} (${year})`);
      }
    }

    // Batched insert for majors
    let majorsInserted = 0;
    for (const batch of chunk(majorValues, 500)) {
      await db.insert(catalogMajorsT).values(batch);
      majorsInserted += batch.length;
    }

    // 4. Process minors
    const minorDir = path.join(scraperPath, "degrees", "minor");
    const minorFiles = findFiles(minorDir, "parsed.initial.json");
    p.log.info(`Found ${pc.bold(String(minorFiles.length))} minor files`);

    const minorValues: (typeof catalogMinorsT.$inferInsert)[] = [];

    for (const file of minorFiles) {
      const raw = JSON.parse(readFileSync(file, "utf-8"));

      minorValues.push({
        name: raw.name,
        totalCreditsRequired: raw.totalCreditsRequired,
        yearVersion: raw.yearVersion,
        requirementSections: raw.requirementSections,
        concentrationOptions: raw.concentrations?.concentrationOptions ?? [],
      });

      if (isVerbose()) {
        const { year } = extractPathParts(file);
        p.log.info(`  Minor: ${pc.dim(raw.name)} (${year})`);
      }
    }

    // Batched insert for minors
    let minorsInserted = 0;
    for (const batch of chunk(minorValues, 500)) {
      await db.insert(catalogMinorsT).values(batch);
      minorsInserted += batch.length;
    }

    // 5. Epic Summary!!!!!!!!!!!
    p.outro(
      `Inserted ${pc.bold(String(majorsInserted))} majors, ${pc.bold(String(minorsInserted))} minors`,
    );
  },
});
