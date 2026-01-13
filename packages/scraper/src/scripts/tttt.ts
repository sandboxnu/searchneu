import { eq, and } from "drizzle-orm";
import { getDb } from "@sneu/db/pg";
import { sectionsT, trackersT } from "@sneu/db/schema";
import * as fs from "fs";

interface TrackerData {
  id: number;
  userId: number;
  sectionId: number;
  notificationMethod: string;
  messageCount: number;
  messageLimit: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  "id'": number;
  term: string;
  courseId: number;
  crn: string;
  faculty: string;
  seatCapacity: number;
  seatRemaining: number;
  waitlistCapacity: number;
  waitlistRemaining: number;
  classType: string;
  honors: boolean;
  campus: string;
  "updatedAt'": string;
}

async function restoreTrackers(jsonFilePath: string, dryRun = false) {
  console.log(`Reading trackers from: ${jsonFilePath}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  const db = getDb();

  const fileContent = fs.readFileSync(jsonFilePath, "utf-8");
  const trackers = JSON.parse(fileContent) as TrackerData[];

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{
    userId: number;
    term: string;
    crn: string;
    error: string;
  }> = [];

  for (const [index, tracker] of trackers.entries()) {
    try {
      console.log(
        `[${index + 1}/${trackers.length}] Processing tracker for user ${tracker.userId}, term ${tracker.term}, CRN ${tracker.crn}`,
      );

      // Look up the section by term and crn
      const sections = await db
        .select()
        .from(sectionsT)
        .where(
          and(eq(sectionsT.term, tracker.term), eq(sectionsT.crn, tracker.crn)),
        )
        .limit(1);

      if (sections.length === 0) {
        throw new Error("Section not found in database");
      }

      const section = sections[0];
      console.log(`  ✓ Found section ID: ${section.id}`);

      if (!dryRun) {
        // Insert the tracker with the correct sectionId
        await db.insert(trackersT).values({
          userId: tracker.userId,
          sectionId: section.id,
          notificationMethod: tracker.notificationMethod as any,
          messageCount: tracker.messageCount,
          messageLimit: tracker.messageLimit,
          createdAt: new Date(tracker.createdAt),
          updatedAt: new Date(tracker.updatedAt),
          deletedAt: tracker.deletedAt ? new Date(tracker.deletedAt) : null,
        });
        console.log(`  ✓ Tracker inserted successfully\n`);
      } else {
        console.log(`  ✓ Would insert tracker (dry run)\n`);
      }

      successCount++;
    } catch (error) {
      errorCount++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({
        userId: tracker.userId,
        term: tracker.term,
        crn: tracker.crn,
        error: errorMsg,
      });
      console.error(`  ✗ Error: ${errorMsg}\n`);
    }
  }

  // Summary
  console.log("=".repeat(50));
  console.log("SUMMARY");
  console.log("=".repeat(50));
  console.log(`Total trackers: ${trackers.length}`);
  console.log(`Successfully processed: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log("\nFailed Trackers:");
    console.log("-".repeat(50));
    errors.forEach(({ userId, term, crn, error }) => {
      console.log(
        `User ID: ${userId}, Term: ${term}, CRN: ${crn}\n  Error: ${error}\n`,
      );
    });
  }

  return { successCount, errorCount, errors };
}

// Main execution
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const jsonFilePath =
  args.find((arg) => !arg.startsWith("--")) || "./trackers.json";

console.log("Course Tracker Restoration Script");
console.log("=".repeat(50));

restoreTrackers(jsonFilePath, dryRun)
  .then(({ successCount, errorCount }) => {
    console.log("\n✓ Restoration complete!");
    process.exit(errorCount > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("\n✗ Fatal error:", error);
    process.exit(1);
  });
