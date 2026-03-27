/**
 * CLI tool: backup-db
 *
 * Exports tracker, notification, and scheduler tables to JSON files.
 * Tracker rows are enriched with natural keys (term code + CRN) so they
 * can survive a catalog drop/re-upload cycle.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { defineCommand } from "citty";
import { brandIntro, p, pc, setVerbosity } from "../ui";
import { getDb } from "@sneu/db/pg";
import { termsT, sectionsT, trackersT, notificationsT } from "@sneu/db/schema";
import {
  savedPlansT,
  savedPlanCoursesT,
  savedPlanSectionsT,
  generatedSchedulesT,
  generatedScheduleSectionsT,
  favoritedSchedulesT,
  favoritedScheduleSectionsT,
} from "@sneu/db/schema";
import { eq } from "drizzle-orm";

export default defineCommand({
  meta: {
    name: "backup-db",
    description:
      "export trackers, notifications, and scheduler tables as JSON backup files",
  },
  args: {
    outDir: {
      type: "string",
      default: "backups",
      description: "directory to write backup files to",
    },
    verbose: {
      alias: "v",
      type: "boolean",
      description: "show detailed output",
    },
  },
  async run({ args }) {
    setVerbosity({ verbose: args.verbose });
    brandIntro("tools backup-db");

    const db = getDb(process.env.DATABASE_URL!, true);
    const outDir = path.resolve(args.outDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(outDir, `backup-${timestamp}`);

    mkdirSync(backupDir, { recursive: true });
    p.log.info(`Writing backups to ${pc.dim(backupDir)}`);

    // ── Trackers (enriched with term + CRN) ──────────────────
    const trackers = await db
      .select({
        id: trackersT.id,
        userId: trackersT.userId,
        sectionId: trackersT.sectionId,
        notificationMethod: trackersT.notificationMethod,
        messageCount: trackersT.messageCount,
        messageLimit: trackersT.messageLimit,
        createdAt: trackersT.createdAt,
        updatedAt: trackersT.updatedAt,
        deletedAt: trackersT.deletedAt,
        // natural keys for re-linking
        term: termsT.term,
        partOfTerm: termsT.partOfTerm,
        crn: sectionsT.crn,
      })
      .from(trackersT)
      .innerJoin(sectionsT, eq(trackersT.sectionId, sectionsT.id))
      .innerJoin(termsT, eq(sectionsT.termId, termsT.id));

    writeJson(backupDir, "trackers.json", trackers);
    p.log.info(`  trackers: ${pc.bold(String(trackers.length))} rows`);

    // ── Notifications ────────────────────────────────────────
    const notifications = await db.select().from(notificationsT);
    writeJson(backupDir, "notifications.json", notifications);
    p.log.info(
      `  notifications: ${pc.bold(String(notifications.length))} rows`,
    );

    // ── Scheduler tables ─────────────────────────────────────
    const tables = [
      { name: "saved_plans", data: await db.select().from(savedPlansT) },
      {
        name: "saved_plan_courses",
        data: await db.select().from(savedPlanCoursesT),
      },
      {
        name: "saved_plan_sections",
        data: await db.select().from(savedPlanSectionsT),
      },
      {
        name: "generated_schedules",
        data: await db.select().from(generatedSchedulesT),
      },
      {
        name: "generated_schedule_sections",
        data: await db.select().from(generatedScheduleSectionsT),
      },
      {
        name: "favorited_schedules",
        data: await db.select().from(favoritedSchedulesT),
      },
      {
        name: "favorited_schedule_sections",
        data: await db.select().from(favoritedScheduleSectionsT),
      },
    ] as const;

    for (const { name, data } of tables) {
      writeJson(backupDir, `${name}.json`, data);
      p.log.info(`  ${name}: ${pc.bold(String(data.length))} rows`);
    }

    p.outro(`Backup complete → ${pc.dim(backupDir)}`);
  },
});

function writeJson(dir: string, filename: string, data: unknown) {
  writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2));
}
