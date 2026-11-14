/**
 * Step 10 - the only thing that writes the catalog. Resolves the plan's
 * natural keys to row ids, in one transaction per term.
 *
 * Nothing is deleted. A row Banner stopped listing has its tombstone columns
 * set and is left in place.
 */

import { eq, inArray, sql } from "drizzle-orm";
import {
  courseNupathJoinT,
  coursesT,
  meetingTimesT,
  roomsT,
  sectionSeatHistoryT,
  sectionsT,
  termsT,
} from "@sneu/db/schema";
import { chunk, type Tx } from "../../upload/types";
import type { Lookups } from "./state";
import {
  SEAT_FIELDS,
  type PartPlan,
  type Plan,
  type SectionUpdate,
  type SectionValues,
} from "./plan";
import type { TombstoneChange } from "./tombstone";

export interface NotifiableSection {
  sectionId: number;
  crn: string;
}

export interface PartChangeset {
  partOfTerm: string;
  termId: number;
  coursesInserted: number;
  coursesUpdated: number;
  sectionsInserted: number;
  sectionsUpdated: number;
  meetingTimesInserted: number;
  meetingTimesDeleted: number;
  roomsCreated: number;
  nupathsInserted: number;
  nupathsDeleted: number;
  tombstonesWritten: number;
  seatHistoryWritten: number;
}

export interface Changeset {
  term: string;
  parts: PartChangeset[];
  /** sections that went from no seats to some, for notifications */
  seatOpened: NotifiableSection[];
  waitlistOpened: NotifiableSection[];
}

/**
 * `observedAt` stamps the seat history rows; the daemon passes the pass's
 * start so they line up with its `ingest_runs` row.
 */
export async function apply(
  tx: Tx,
  plan: Plan,
  lookups: Lookups,
  observedAt: Date,
): Promise<Changeset> {
  const parts: PartChangeset[] = [];
  for (const part of plan.parts) {
    parts.push(await applyPart(tx, plan.term, part, lookups, observedAt));
  }

  const opened = notificationsFrom(plan);
  return {
    term: plan.term,
    parts,
    seatOpened: opened.seatOpened,
    waitlistOpened: opened.waitlistOpened,
  };
}

/**
 * Read off the plan rather than re-derived from Banner, so a notification
 * and the write behind it can never disagree.
 */
export function notificationsFrom(plan: Plan): {
  seatOpened: NotifiableSection[];
  waitlistOpened: NotifiableSection[];
} {
  const seatOpened: NotifiableSection[] = [];
  const waitlistOpened: NotifiableSection[] = [];

  for (const part of plan.parts) {
    for (const update of part.sections.update) {
      if (opened(update, "seatRemaining")) {
        seatOpened.push({ sectionId: update.id, crn: update.crn });
      } else if (opened(update, "waitlistRemaining")) {
        // a section with real seats is not also a waitlist notification
        waitlistOpened.push({ sectionId: update.id, crn: update.crn });
      }
    }
  }

  return { seatOpened, waitlistOpened };
}

function opened(
  update: SectionUpdate,
  field: "seatRemaining" | "waitlistRemaining",
): boolean {
  const next = update.changes[field];
  const previous = update.before[field];
  return previous === 0 && next !== undefined && next > 0;
}

/**
 * The sections that get a seat history row this pass. `sectionIds` maps CRN
 * to id for every section in the part, inserts included.
 */
export function seatHistoryIds(
  part: PartPlan,
  sectionIds: Map<string, number>,
): number[] {
  const ids: number[] = [];

  for (const update of part.sections.update) {
    if (SEAT_FIELDS.some((field) => field in update.changes)) {
      ids.push(update.id);
    }
  }

  // inserts have no history yet, so this row is where their chart starts
  for (const section of part.sections.insert) {
    const id = sectionIds.get(section.crn);
    if (id === undefined) {
      throw new Error(`section ${section.crn} was not inserted`);
    }
    ids.push(id);
  }

  return ids;
}

/**
 * Copied from the rows this transaction just wrote rather than from the
 * plan, so history always matches what the catalog served.
 */
async function writeSeatHistory(
  tx: Tx,
  sectionIds: number[],
  observedAt: Date,
): Promise<number> {
  for (const batch of chunk(sectionIds, 2000)) {
    await tx
      .insert(sectionSeatHistoryT)
      .select(
        tx
          .select({
            sectionId: sectionsT.id,
            // timestamp columns hold UTC, which is how Drizzle writes a Date
            observedAt: sql<Date>`${observedAt.toISOString()}::timestamp`.as(
              "observedAt",
            ),
            seatCapacity: sectionsT.seatCapacity,
            seatRemaining: sectionsT.seatRemaining,
            waitlistCapacity: sectionsT.waitlistCapacity,
            waitlistRemaining: sectionsT.waitlistRemaining,
          })
          .from(sectionsT)
          .where(inArray(sectionsT.id, batch)),
      )
      // a light and deep round in the same pass share `observedAt`
      .onConflictDoNothing();
  }

  return sectionIds.length;
}

async function applyPart(
  tx: Tx,
  term: string,
  part: PartPlan,
  lookups: Lookups,
  observedAt: Date,
): Promise<PartChangeset> {
  const termId = await upsertTermRow(tx, term, part);

  for (const batch of chunk(part.courses.insert, 2000)) {
    await tx.insert(coursesT).values(
      batch.map((course) => ({
        termId,
        name: course.values.name,
        subject: course.subjectId,
        courseNumber: course.courseNumber,
        register: course.register,
        description: course.values.description,
        minCredits: course.values.minCredits,
        maxCredits: course.values.maxCredits,
        prereqs: course.values.prereqs,
        coreqs: course.values.coreqs,
        postreqs: course.values.postreqs,
      })),
    );
  }

  for (const update of part.courses.update) {
    await tx
      .update(coursesT)
      .set(update.changes)
      .where(eq(coursesT.id, update.id));
  }

  const courseIds = await registerIndex(tx, termId);

  for (const batch of chunk(part.sections.insert, 2000)) {
    await tx.insert(sectionsT).values(
      batch.map((section) => {
        const courseId = courseIds.get(section.register);
        if (courseId === undefined) {
          throw new Error(`course ${section.register} was not inserted`);
        }
        return { termId, courseId, crn: section.crn, ...section.values };
      }),
    );
  }

  const sectionsUpdated = await updateSections(tx, part.sections.update);

  await touch(tx, coursesT, part.confirmed.courses);
  await touch(tx, sectionsT, part.confirmed.sections);

  const roomsCreated = await ensureRooms(tx, part, lookups);
  const sectionIds = await crnIndex(tx, termId);

  const seatHistoryWritten = await writeSeatHistory(
    tx,
    seatHistoryIds(part, sectionIds),
    observedAt,
  );

  // deletes go first: a room change re-inserts the same days and times,
  // which the unique key would otherwise drop as a conflict
  for (const batch of chunk(part.meetingTimes.delete, 2000)) {
    await tx.delete(meetingTimesT).where(inArray(meetingTimesT.id, batch));
  }

  for (const batch of chunk(part.meetingTimes.insert, 2000)) {
    await tx
      .insert(meetingTimesT)
      .values(
        batch.map((meeting) => {
          const sectionId = sectionIds.get(meeting.crn);
          if (sectionId === undefined) {
            throw new Error(`section ${meeting.crn} was not inserted`);
          }
          return {
            termId,
            sectionId,
            roomId: roomId(lookups, meeting.building, meeting.room),
            days: meeting.days,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
          };
        }),
      )
      .onConflictDoNothing({
        target: [
          meetingTimesT.termId,
          meetingTimesT.sectionId,
          meetingTimesT.days,
          meetingTimesT.startTime,
          meetingTimesT.endTime,
        ],
      });
  }

  for (const batch of chunk(part.nupaths.insert, 2000)) {
    await tx
      .insert(courseNupathJoinT)
      .values(
        batch.map((join) => {
          const courseId = courseIds.get(join.register);
          if (courseId === undefined) {
            throw new Error(`course ${join.register} was not inserted`);
          }
          return { courseId, nupathId: join.nupathId };
        }),
      )
      .onConflictDoNothing({
        target: [courseNupathJoinT.courseId, courseNupathJoinT.nupathId],
      });
  }

  for (const join of part.nupaths.delete) {
    await tx
      .delete(courseNupathJoinT)
      .where(
        sql`${courseNupathJoinT.courseId} = ${join.courseId} and ${courseNupathJoinT.nupathId} = ${join.nupathId}`,
      );
  }

  const tombstonesWritten =
    (await writeTombstones(tx, coursesT, part.tombstones.courses)) +
    (await writeTombstones(tx, sectionsT, part.tombstones.sections));

  return {
    partOfTerm: part.partOfTerm,
    termId,
    coursesInserted: part.courses.insert.length,
    coursesUpdated: part.courses.update.length,
    sectionsInserted: part.sections.insert.length,
    sectionsUpdated,
    meetingTimesInserted: part.meetingTimes.insert.length,
    meetingTimesDeleted: part.meetingTimes.delete.length,
    roomsCreated,
    nupathsInserted: part.nupaths.insert.length,
    nupathsDeleted: part.nupaths.delete.length,
    tombstonesWritten,
    seatHistoryWritten,
  };
}

async function upsertTermRow(
  tx: Tx,
  term: string,
  part: PartPlan,
): Promise<number> {
  if (part.termRow.termId === null) {
    throw new Error(`part ${part.partOfTerm} has no term row to write to`);
  }

  if (part.termRow.op === "update") {
    await tx
      .update(termsT)
      .set({ name: part.termRow.name, activeUntil: part.termRow.activeUntil })
      .where(eq(termsT.id, part.termRow.termId));
  }

  return part.termRow.termId;
}

const SECTION_COLUMN_TYPE: Record<keyof SectionValues, string> = {
  faculty: "text",
  seatCapacity: "integer",
  seatRemaining: "integer",
  waitlistCapacity: "integer",
  waitlistRemaining: "integer",
  classType: "text",
  honors: "boolean",
  campus: "integer",
};

/**
 * Seat changes are the bulk of every pass, so updates are grouped by the
 * columns they touch and each group goes out as one statement.
 */
async function updateSections(
  tx: Tx,
  updates: SectionUpdate[],
): Promise<number> {
  const groups = new Map<string, SectionUpdate[]>();
  for (const update of updates) {
    const key = Object.keys(update.changes).sort().join(",");
    const existing = groups.get(key);
    if (existing) existing.push(update);
    else groups.set(key, [update]);
  }

  let written = 0;

  for (const [key, group] of groups) {
    const fields = key.split(",") as (keyof SectionValues)[];

    for (const batch of chunk(group, 2000)) {
      // raw SQL skips Drizzle's $onUpdate, so updatedAt is set by hand
      const assignments = [
        ...fields.map(
          (field, i) =>
            sql`${sql.identifier(field)} = v.c${sql.raw(String(i))}::${sql.raw(SECTION_COLUMN_TYPE[field])}`,
        ),
        sql`${sql.identifier(sectionsT.updatedAt.name)} = now()`,
      ];
      const rows = batch.map(
        (update) =>
          sql`(${update.id}, ${sql.join(
            fields.map((field) => sql`${update.changes[field]}`),
            sql`, `,
          )})`,
      );
      const columns = fields.map((_, i) => sql.raw(`c${i}`));

      await tx.execute(sql`
        update ${sectionsT}
        set ${sql.join(assignments, sql`, `)}
        from (values ${sql.join(rows, sql`, `)}) as v(id, ${sql.join(columns, sql`, `)})
        where ${sectionsT.id} = v.id::integer
      `);

      written += batch.length;
    }
  }

  return written;
}

/** Buildings are config as code and the rails block on an unknown one. */
async function ensureRooms(
  tx: Tx,
  part: PartPlan,
  lookups: Lookups,
): Promise<number> {
  const wanted = new Map<string, { code: string; buildingId: number }>();

  for (const meeting of part.meetingTimes.insert) {
    if (!meeting.building || !meeting.room) continue;
    const key = `${meeting.building}:${meeting.room}`;
    if (lookups.rooms.has(key) || wanted.has(key)) continue;

    const buildingId = lookups.buildings.get(meeting.building);
    if (buildingId === undefined) {
      throw new Error(`building ${meeting.building} is not in config`);
    }
    wanted.set(key, { code: meeting.room, buildingId });
  }

  if (wanted.size === 0) return 0;

  const inserted = await tx
    .insert(roomsT)
    .values([...wanted.values()])
    .returning({
      id: roomsT.id,
      code: roomsT.code,
      buildingId: roomsT.buildingId,
    });

  const codeByBuildingId = new Map(
    [...lookups.buildings].map(([code, id]) => [id, code]),
  );
  for (const room of inserted) {
    const building = codeByBuildingId.get(room.buildingId);
    if (building) lookups.rooms.set(`${building}:${room.code}`, room.id);
  }

  return inserted.length;
}

function roomId(
  lookups: Lookups,
  building: string | null,
  room: string | null,
): number | null {
  if (!building || !room) return null;
  return lookups.rooms.get(`${building}:${room}`) ?? null;
}

/** Banner confirmed these rows' detail, so the TTL restarts from now. */
async function touch(
  tx: Tx,
  table: typeof coursesT | typeof sectionsT,
  ids: number[],
): Promise<void> {
  for (const batch of chunk(ids, 2000)) {
    await tx
      .update(table)
      .set({ updatedAt: new Date() })
      .where(inArray(table.id, batch));
  }
}

async function writeTombstones(
  tx: Tx,
  table: typeof coursesT | typeof sectionsT,
  changes: TombstoneChange[],
): Promise<number> {
  for (const change of changes) {
    await tx
      .update(table)
      .set({
        missingSince: change.missingSince,
        tombstonedAt: change.tombstonedAt,
      })
      .where(eq(table.id, change.id));
  }

  return changes.length;
}

async function registerIndex(
  tx: Tx,
  termId: number,
): Promise<Map<string, number>> {
  const rows = await tx
    .select({ id: coursesT.id, register: coursesT.register })
    .from(coursesT)
    .where(eq(coursesT.termId, termId));
  return new Map(rows.map((row) => [row.register, row.id]));
}

async function crnIndex(tx: Tx, termId: number): Promise<Map<string, number>> {
  const rows = await tx
    .select({ id: sectionsT.id, crn: sectionsT.crn })
    .from(sectionsT)
    .where(eq(sectionsT.termId, termId));
  return new Map(rows.map((row) => [row.crn, row.id]));
}
