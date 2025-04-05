import {
  boolean,
  decimal,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const coursesT = pgTable(
  "courses",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    term: varchar({ length: 6 })
      .notNull()
      .references(() => termsT.term),
    name: text().notNull(),
    subject: varchar({ length: 6 }).notNull(),
    courseNumber: varchar({ length: 6 }).notNull(),
    description: text().notNull(),
    minCredits: decimal().notNull(),
    maxCredits: decimal().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.term, table.subject],
      foreignColumns: [subjectsT.term, subjectsT.code],
    }),
  ],
);

export const sectionsT = pgTable("sections", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer()
    .notNull()
    .references(() => coursesT.id),
  crn: varchar({ length: 5 }).notNull().unique(),
  faculty: text().notNull(), // TODO: support multiple faculty
  seatCapacity: integer().notNull(),
  seatRemaining: integer().notNull(),
  waitlistCapacity: integer().notNull(),
  waitlistRemaining: integer().notNull(),
  classType: text().notNull(),
  honors: boolean().notNull(),
  campus: text().notNull(),
});

export const termsT = pgTable("terms", {
  term: varchar({ length: 6 }).primaryKey(),
  name: text().notNull(),
  activeUntil: timestamp().notNull().defaultNow(),
});

export const subjectsT = pgTable(
  "subjects",
  {
    term: varchar({ length: 6 })
      .notNull()
      .references(() => termsT.term),
    code: varchar({ length: 6 }).notNull(),
    name: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.term, table.code] })],
);
