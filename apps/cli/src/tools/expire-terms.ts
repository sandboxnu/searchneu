/**
 * Subcommand: expire-terms
 * Sets activeUntil on old terms in manifest.yaml.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";
import { defineCommand } from "citty";
import { StaticManifestConfig } from "@sneu/scraper/static-config";
import { brandIntro, p, pc, setVerbosity } from "../ui";

export default defineCommand({
  meta: {
    name: "expire-terms",
    description: "set activeUntil for terms older than a given threshold",
  },
  args: {
    olderThan: {
      type: "string",
      description: "expire all terms with a term code lower than this value",
      required: true,
    },
    activeUntil: {
      type: "string",
      description:
        "the date to set activeUntil to (ISO format, e.g. 2024-01-01). defaults to today",
      required: false,
    },
    configPath: {
      type: "string",
      default: process.env.SCRAPER_CONFIG_PATH ?? "config/",
      description:
        "path to config directory containing manifest.yaml (env: SCRAPER_CONFIG_PATH)",
      required: false,
    },
    dryRun: {
      type: "boolean",
      description: "show changes without writing",
      required: false,
    },
    verbose: {
      alias: "v",
      type: "boolean",
      description: "",
      required: false,
    },
  },
  async run({ args }) {
    setVerbosity({ verbose: args.verbose });
    brandIntro("tools expire-terms");

    const threshold = Number(args.olderThan);
    if (Number.isNaN(threshold)) {
      p.cancel(`Invalid term code: ${args.olderThan} (must be a number)`);
      process.exit(1);
    }

    const activeUntil =
      args.activeUntil ?? new Date().toISOString().split("T")[0]!;

    const manifestPath = path.resolve(args.configPath, "manifest.yaml");
    if (!existsSync(manifestPath)) {
      p.cancel(`Manifest not found: ${manifestPath}`);
      process.exit(1);
    }

    const raw = parse(readFileSync(manifestPath, "utf8"));
    const result = StaticManifestConfig.safeParse(raw);
    if (!result.success) {
      p.log.error(pc.red(String(result.error)));
      p.cancel("Failed to parse manifest.yaml");
      process.exit(1);
    }

    const manifest = result.data;
    let affected = 0;

    const updated = manifest.terms.map((t) => {
      if (t.term < threshold) {
        affected++;
        const expiredParts = t.parts?.map((pt) => ({
          ...pt,
          activeUntil,
        }));
        return { ...t, activeUntil, parts: expiredParts };
      }
      return t;
    });

    p.log.info(
      `Setting ${pc.bold(`activeUntil=${activeUntil}`)} on ${pc.bold(String(affected))} of ${manifest.terms.length} terms`,
    );

    if (affected === 0) {
      p.outro(`No terms found older than ${threshold}`);
      return;
    }

    if (args.dryRun) {
      p.note(
        updated
          .filter((t) => t.term < threshold)
          .map(
            (t) =>
              `term ${pc.cyan(String(t.term))} → activeUntil: ${activeUntil}`,
          )
          .join("\n"),
        "Dry Run — would update",
      );
      p.outro("Dry run complete — no files written");
      return;
    }

    writeFileSync(manifestPath, stringify({ terms: updated }));
    p.outro("Manifest updated");
  },
});
