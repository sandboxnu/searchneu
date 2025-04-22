import {
  boolean,
  decimal,
  foreignKey,
  index,
  integer,
  json,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
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
    nupaths: varchar({ length: 200 }).array().notNull(),
    prereqs: jsonb().notNull(),
    coreqs: jsonb().notNull(),
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
  meetingTimes: json().notNull(),
});

export const termsT = pgTable("terms", {
  term: varchar({ length: 6 }).primaryKey(),
  name: text().notNull(),
  activeUntil: timestamp().notNull().defaultNow(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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

export const usersT = pgTable(
  "users",
  {
    userId: varchar({ length: 191 })
      .primaryKey()
      .$default(() => crypto.randomUUID()), // PERF: maybe this doesnt need to be crypto
    phoneNumber: varchar({ length: 20 }).notNull().unique(),
    plan: integer()
      .notNull()
      .default(0) // the 0th plan will be the default limits
      .references(() => plansT.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("phone_idx").on(table.phoneNumber)],
);

// TODO: lol
export const subscriptionsT = pgTable("subscriptions", {});

export const plansT = pgTable("plans", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text(),
  x: integer().notNull(),
  y: integer().notNull(),
});
