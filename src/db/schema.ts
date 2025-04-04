import {
  boolean,
  decimal,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  text,
  varchar,
} from "drizzle-orm/pg-core";

export const coursesTable = pgTable(
  "courses",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    term: varchar({ length: 6 })
      .notNull()
      .references(() => termsTable.term),
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
      foreignColumns: [subjectsTable.term, subjectsTable.code],
    }),
  ],
);

export const sectionsTable = pgTable("sections", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer()
    .notNull()
    .references(() => coursesTable.id),
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

export const termsTable = pgTable("terms", {
  term: varchar({ length: 6 }).primaryKey(),
  name: text().notNull(),
});

export const subjectsTable = pgTable(
  "subjects",
  {
    term: varchar({ length: 6 })
      .notNull()
      .references(() => termsTable.term),
    code: varchar({ length: 6 }).notNull(),
    name: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.term, table.code] })],
);
