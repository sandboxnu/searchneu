import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user as usersT } from "./auth";
import { termsT, sectionsT } from "./catalog";

export const generatedSchedulesT = pgTable(
  "generated_schedules",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
      .notNull()
      .references(() => usersT.id, { onDelete: "cascade" }),
    term: varchar({ length: 6 })
      .notNull()
      .references(() => termsT.term, { onDelete: "cascade" }),

    name: text().notNull().default("Schedule"),

    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp(),
  },
  (table) => [
    index("gs_user_idx").on(table.userId),
    index("gs_term_idx").on(table.term),
  ],
);

export const generatedScheduleSectionsT = pgTable(
  "generated_schedule_sections",
  {
    scheduleId: integer()
      .notNull()
      .references(() => generatedSchedulesT.id, { onDelete: "cascade" }),
    sectionId: integer()
      .notNull()
      .references(() => sectionsT.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.scheduleId, table.sectionId] }),
    index("gss_section_idx").on(table.sectionId),
  ],
);
