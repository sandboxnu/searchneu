/**
 * CLI tool: sync-db
 *
 * Compares the database state against the static config files and reports
 * drift (entries in DB that are not defined in config). With --prune, removes
 * stale entries that have no foreign-key dependents.
 */

import path from "node:path";
import { defineCommand } from "citty";
import { brandIntro, p, pc, setVerbosity, isVerbose } from "../ui";
import { getDb } from "@sneu/db/pg";
import {
  buildingsT,
  campusesT,
  coursesT,
  meetingTimesT,
  roomsT,
  sectionsT,
  subjectsT,
} from "@sneu/db/schema";
import { inArray } from "drizzle-orm";
import {
  StaticBuildingsConfig,
  StaticCampusesConfig,
  StaticSubjectsConfig,
} from "@sneu/scraper/static-config";
import { loadYamlFile } from "../helpers";

type StaleEntry = { id: number; code: string; refCount: number };

export default defineCommand({
  meta: {
    name: "sync-db",
    description:
      "detect and fix drift between the database and static config files",
  },
  args: {
    configPath: {
      type: "string",
      default: process.env.SCRAPER_CONFIG_PATH ?? "config/",
      description: "path to config directory (env: SCRAPER_CONFIG_PATH)",
    },
    prune: {
      type: "boolean",
      description: "remove stale entries that have no dependents",
    },
    dryRun: {
      type: "boolean",
      description: "show what --prune would do without actually deleting",
    },
    verbose: {
      alias: "v",
      type: "boolean",
      description: "show detailed output",
    },
  },
  async run({ args }) {
    setVerbosity({ verbose: args.verbose });
    brandIntro("tools sync-db");

    const configDir = path.resolve(args.configPath);

    // Load config files
    const campusesConfig = loadYamlFile(
      path.join(configDir, "campuses.yaml"),
      StaticCampusesConfig,
    );
    const buildingsConfig = loadYamlFile(
      path.join(configDir, "buildings.yaml"),
      StaticBuildingsConfig,
    );
    const subjectsConfig = loadYamlFile(
      path.join(configDir, "subjects.yaml"),
      StaticSubjectsConfig,
    );

    if (!campusesConfig || !buildingsConfig || !subjectsConfig) {
      p.cancel("Failed to load one or more config files from " + configDir);
      return;
    }

    const db = getDb(process.env.DATABASE_URL!, true);

    // Build sets of known codes from config
    const configCampusCodes = new Set<string>();
    for (const c of campusesConfig.campuses) {
      configCampusCodes.add(c.code);
      for (const a of c.aliases ?? []) configCampusCodes.add(a);
    }

    const configBuildingCodes = new Set<string>();
    for (const b of buildingsConfig.buildings) {
      configBuildingCodes.add(b.code);
      for (const a of b.aliases ?? []) configBuildingCodes.add(a);
    }

    const configSubjectCodes = new Set<string>();
    for (const s of subjectsConfig.subjects) {
      configSubjectCodes.add(s.code);
      for (const a of s.aliases ?? []) configSubjectCodes.add(a);
    }

    // Query DB state
    const dbCampuses = await db
      .select({
        id: campusesT.id,
        code: campusesT.code,
        name: campusesT.name,
      })
      .from(campusesT);
    const dbBuildings = await db
      .select({
        id: buildingsT.id,
        code: buildingsT.code,
        name: buildingsT.name,
      })
      .from(buildingsT);
    const dbSubjects = await db
      .select({
        id: subjectsT.id,
        code: subjectsT.code,
        name: subjectsT.name,
      })
      .from(subjectsT);

    // Detect stale entries
    const staleCampusIds = dbCampuses
      .filter((c) => !configCampusCodes.has(c.code))
      .map((c) => c.id);
    const staleBuildingIds = dbBuildings
      .filter((b) => !configBuildingCodes.has(b.code))
      .map((b) => b.id);
    const staleSubjectIds = dbSubjects
      .filter((s) => !configSubjectCodes.has(s.code))
      .map((s) => s.id);

    // Count FK references for stale entries
    const staleCampuses = await countRefs(
      dbCampuses,
      staleCampusIds,
      async (ids) => {
        if (ids.length === 0) return new Map();
        const rows = await db
          .select({ campus: sectionsT.campus })
          .from(sectionsT)
          .where(inArray(sectionsT.campus, ids));
        return countBy(rows, (r) => r.campus);
      },
    );

    const staleBuildings = await countRefs(
      dbBuildings,
      staleBuildingIds,
      async (ids) => {
        if (ids.length === 0) return new Map();
        const rows = await db
          .select({ buildingId: roomsT.buildingId })
          .from(roomsT)
          .where(inArray(roomsT.buildingId, ids));
        return countBy(rows, (r) => r.buildingId);
      },
    );

    const staleSubjects = await countRefs(
      dbSubjects,
      staleSubjectIds,
      async (ids) => {
        if (ids.length === 0) return new Map();
        const rows = await db
          .select({ subject: coursesT.subject })
          .from(coursesT)
          .where(inArray(coursesT.subject, ids));
        return countBy(rows, (r) => r.subject);
      },
    );

    // Orphaned rooms
    const configBuildingIds = new Set(
      dbBuildings
        .filter((b) => configBuildingCodes.has(b.code))
        .map((b) => b.id),
    );
    const dbRooms = await db
      .select({
        id: roomsT.id,
        code: roomsT.code,
        buildingId: roomsT.buildingId,
      })
      .from(roomsT);
    const orphanedRoomIds = dbRooms
      .filter((r) => !configBuildingIds.has(r.buildingId))
      .map((r) => r.id);

    let orphanedRoomMtRefs = 0;
    if (orphanedRoomIds.length > 0) {
      const mtRows = await db
        .select({ roomId: meetingTimesT.roomId })
        .from(meetingTimesT)
        .where(inArray(meetingTimesT.roomId, orphanedRoomIds));
      orphanedRoomMtRefs = mtRows.length;
    }

    // Report
    const hasAnyDrift =
      staleCampuses.length > 0 ||
      staleBuildings.length > 0 ||
      staleSubjects.length > 0 ||
      orphanedRoomIds.length > 0;

    if (!hasAnyDrift) {
      p.outro("No drift detected — database matches config");
      return;
    }

    // Build drift report
    const driftLines: string[] = [];
    formatDriftLines("campuses", staleCampuses, driftLines);
    formatDriftLines("buildings", staleBuildings, driftLines);
    formatDriftLines("subjects", staleSubjects, driftLines);

    if (orphanedRoomIds.length > 0) {
      driftLines.push(
        `${pc.yellow("rooms")}: ${orphanedRoomIds.length} orphaned (building not in config)` +
          (orphanedRoomMtRefs > 0
            ? ` — ${orphanedRoomMtRefs} meeting time refs`
            : ""),
      );
    }

    p.note(driftLines.join("\n"), "Drift Report");

    if (!args.prune) {
      p.outro(
        `Run with ${pc.bold("--prune")} to remove stale entries without dependents`,
      );
      return;
    }

    // Prune stale entries with no dependents
    const prunable = {
      campuses: staleCampuses.filter((e) => e.refCount === 0),
      buildings: staleBuildings.filter((e) => e.refCount === 0),
      subjects: staleSubjects.filter((e) => e.refCount === 0),
      rooms: orphanedRoomMtRefs === 0 ? orphanedRoomIds : [],
    };

    const totalPrunable =
      prunable.campuses.length +
      prunable.buildings.length +
      prunable.subjects.length +
      prunable.rooms.length;

    if (totalPrunable === 0) {
      p.log.warning(
        "All stale entries have dependents — nothing safe to prune",
      );
      p.outro(
        "Remove dependents first, or update config to include these entries",
      );
      return;
    }

    const pruneLines: string[] = [];

    if (prunable.rooms.length > 0) {
      pruneLines.push(`rooms: ${prunable.rooms.length} orphaned`);
      if (!args.dryRun) {
        await db.delete(roomsT).where(inArray(roomsT.id, prunable.rooms));
      }
    }

    if (prunable.buildings.length > 0) {
      pruneLines.push(
        `buildings: ${prunable.buildings.map((e) => e.code).join(", ")}`,
      );
      if (!args.dryRun) {
        await db
          .delete(buildingsT)
          .where(
            inArray(
              buildingsT.id,
              prunable.buildings.map((e) => e.id),
            ),
          );
      }
    }

    if (prunable.subjects.length > 0) {
      pruneLines.push(
        `subjects: ${prunable.subjects.map((e) => e.code).join(", ")}`,
      );
      if (!args.dryRun) {
        await db
          .delete(subjectsT)
          .where(
            inArray(
              subjectsT.id,
              prunable.subjects.map((e) => e.id),
            ),
          );
      }
    }

    if (prunable.campuses.length > 0) {
      pruneLines.push(
        `campuses: ${prunable.campuses.map((e) => e.code).join(", ")}`,
      );
      if (!args.dryRun) {
        await db
          .delete(campusesT)
          .where(
            inArray(
              campusesT.id,
              prunable.campuses.map((e) => e.id),
            ),
          );
      }
    }

    p.note(
      pruneLines.join("\n"),
      args.dryRun ? "Dry Run — would prune" : "Pruned",
    );

    const skipped =
      staleCampuses.length +
      staleBuildings.length +
      staleSubjects.length -
      totalPrunable;
    if (skipped > 0) {
      p.log.warning(
        `${skipped} stale entries skipped (have dependents) — update config or remove dependents first`,
      );
    }

    if (args.dryRun) {
      p.outro("Dry run complete — no changes made");
    } else {
      p.outro(`Pruned ${pc.bold(String(totalPrunable))} stale entries`);
    }
  },
});

// ── Helpers ─────────────────────────────────────────────────

function formatDriftLines(
  entity: string,
  entries: StaleEntry[],
  lines: string[],
) {
  if (entries.length === 0) return;

  const safe = entries.filter((e) => e.refCount === 0);
  const blocked = entries.filter((e) => e.refCount > 0);

  lines.push(
    `${pc.yellow(entity)}: ${entries.length} stale (${pc.green(String(safe.length))} prunable, ${pc.red(String(blocked.length))} have dependents)`,
  );

  if (isVerbose()) {
    for (const e of entries) {
      const status =
        e.refCount > 0
          ? pc.red(`${e.refCount} refs`)
          : pc.green("prunable");
      lines.push(`  ${pc.dim(e.code)} (${status})`);
    }
  }
}

async function countRefs<T extends { id: number; code: string }>(
  allEntries: T[],
  staleIds: number[],
  queryRefs: (ids: number[]) => Promise<Map<number, number>>,
): Promise<StaleEntry[]> {
  if (staleIds.length === 0) return [];

  const refCounts = await queryRefs(staleIds);
  const staleIdSet = new Set(staleIds);

  return allEntries
    .filter((e) => staleIdSet.has(e.id))
    .map((e) => ({
      id: e.id,
      code: e.code,
      refCount: refCounts.get(e.id) ?? 0,
    }));
}

function countBy<T>(rows: T[], key: (row: T) => number): Map<number, number> {
  const map = new Map<number, number>();
  for (const row of rows) {
    const k = key(row);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}
