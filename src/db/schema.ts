import {
  boolean,
  decimal,
  foreignKey,
  integer,
  json,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  index,
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
  term: varchar({ length: 6 })
    .notNull()
    .references(() => termsT.term),
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

export const userRolesEnum = {
  USER: "USER",
  ADMIN: "ADMIN",
  DEVELOPER: "DEVELOPER",
} as const;

export const usersT = pgTable(
  "users",
  {
    userId: varchar({ length: 191 })
      .primaryKey()
      .$default(() => crypto.randomUUID()), // PERF: maybe this doesnt need to be crypto
    phoneNumber: varchar({ length: 20 }).notNull().unique(),
    plan: integer()
      .notNull()
      .default(1) // the 1st plan will be the default limits
      .references(() => plansT.id),
    role: varchar({ length: 20 })
      .notNull()
      .default(userRolesEnum.USER)
      .$type<keyof typeof userRolesEnum>(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("phone_idx").on(table.phoneNumber)],
);

export const plansT = pgTable("plans", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text(),
  maxActiveCourses: integer().notNull().default(5),
  maxNotificationsPerCourse: integer().notNull().default(3),
});

export const courseNotificationsT = pgTable(
  "course_notifications",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar({ length: 191 })
      .notNull()
      .references(() => usersT.userId),
    courseId: integer()
      .notNull()
      .references(() => coursesT.id),
    term: varchar({ length: 6 })
      .notNull()
      .references(() => termsT.term),
    active: boolean().notNull().default(true),
    notifiedCount: integer().notNull().default(0),
    lastNotifiedAt: timestamp(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("user_course_notifications_idx").on(table.userId),
    index("course_notifications_idx").on(table.courseId),
    uniqueIndex("user_course_idx").on(table.userId, table.courseId),
  ],
);

export const seatNotificationsT = pgTable(
  "seat_notifications",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    courseNotificationId: integer()
      .notNull()
      .references(() => courseNotificationsT.id),
    sectionId: integer()
      .notNull()
      .references(() => sectionsT.id),
    active: boolean().notNull().default(true),
    notifiedCount: integer().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("course_notification_idx").on(table.courseNotificationId),
    index("section_notification_idx").on(table.sectionId),
    uniqueIndex("course_notif_section_idx").on(
      table.courseNotificationId,
      table.sectionId,
    ),
  ],
);
