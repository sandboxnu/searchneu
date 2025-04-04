import {
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  text,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const coursesTable = pgTable(
  "courses",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    term: varchar({ length: 6 })
      .notNull()
      .references(() => termsTable.term),
    subject: varchar({ length: 6 }).notNull(),
    courseNumber: varchar({ length: 6 }).notNull(),
    description: text().notNull(),
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
