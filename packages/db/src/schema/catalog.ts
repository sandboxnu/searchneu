import {
  boolean,
  decimal,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
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
    register: text().notNull(),
    description: text().notNull(),
    minCredits: decimal().notNull(),
    maxCredits: decimal().notNull(),
    prereqs: jsonb().notNull(),
    coreqs: jsonb().notNull(),
    postreqs: jsonb().notNull(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.term, table.subject],
      foreignColumns: [subjectsT.term, subjectsT.code],
    }),
    unique("term_course").on(table.term, table.subject, table.courseNumber),
    index("courses_search_idx")
      .using(
        "bm25",
        table.id,
        table.name,
        table.register,
        table.subject,
        table.courseNumber,
        table.term,
      )
      .with({
        key_field: "id",
        // NOTE: this template literal is interpreted as raw SQL and therefore must be escaped properly
        text_fields: `'{
          "name": {"tokenizer": {"type": "ngram", "min_gram": 4, "max_gram": 5, "prefix_only": false}},
          "register": {"tokenizer": {"type": "ngram", "min_gram": 2, "max_gram": 4, "prefix_only": false}},
          "subject": {"fast": true},
          "courseNumber": {"fast": true},
          "term": {"fast": true}
        }'`,
      }),
  ],
);

export const sectionsT = pgTable(
  "sections",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    term: varchar({ length: 6 })
      .notNull()
      .references(() => termsT.term),
    courseId: integer()
      .notNull()
      .references(() => coursesT.id),
    crn: varchar({ length: 5 }).notNull(),
    faculty: text().notNull(), // TODO: support multiple faculty
    seatCapacity: integer().notNull(),
    seatRemaining: integer().notNull(),
    waitlistCapacity: integer().notNull(),
    waitlistRemaining: integer().notNull(),
    classType: text().notNull(),
    honors: boolean().notNull(),
    campus: text()
      .notNull()
      .references(() => campusesT.name),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("crn_idx").on(table.crn),
    index("term_idx").on(table.term),
    unique("term_crn").on(table.term, table.crn),
  ],
);

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

export const campusesT = pgTable(
  "campuses",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().unique(),
    // code: text().array().notNull(),
    group: text(),
  },
  (table) => [uniqueIndex("campus_name_idx").on(table.name)],
);

export const nupathsT = pgTable(
  "nupaths",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    short: varchar({ length: 3 }).notNull().unique(),
    name: text().notNull().unique(),
  },
  (table) => [uniqueIndex("nupath_short_idx").on(table.short)],
);

export const courseNupathJoinT = pgTable(
  "course_nupath_join",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    courseId: integer()
      .notNull()
      .references(() => coursesT.id, { onDelete: "cascade" }),
    nupathId: integer()
      .notNull()
      .references(() => nupathsT.id),
  },
  (table) => [
    index("course_nupath_join_course_idx").on(table.courseId),
    unique("course_nupath_join_unique").on(table.courseId, table.nupathId),
  ],
);

export const buildingsT = pgTable(
  "buildings",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    campus: text().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique("buildings_campus").on(table.campus, table.name)],
);

export const roomsT = pgTable(
  "rooms",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    buildingId: integer()
      .notNull()
      .references(() => buildingsT.id),
    number: varchar({ length: 10 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("building_room").on(table.buildingId, table.number),
    index("building_idx").on(table.buildingId),
  ],
);

export const meetingTimesT = pgTable(
  "meeting_times",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    term: varchar({ length: 6 })
      .notNull()
      .references(() => termsT.term),
    sectionId: integer()
      .notNull()
      .references(() => sectionsT.id, { onDelete: "cascade" }),
    roomId: integer().references(() => roomsT.id),
    days: integer().array().notNull(),
    startTime: integer().notNull(),
    endTime: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("section_meeting_idx").on(table.sectionId),
    index("room_meeting_idx").on(table.roomId),
    unique("meeting_time").on(
      table.term,
      table.sectionId,
      table.days,
      table.startTime,
      table.endTime,
    ),
  ],
);
