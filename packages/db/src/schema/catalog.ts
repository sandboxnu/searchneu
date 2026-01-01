import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
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
    subject: integer()
      .notNull()
      .references(() => subjectsT.id),
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
    unique("term_course").on(table.term, table.subject, table.courseNumber),
    index("courses_search_idx")
      .using(
        "bm25",
        table.id,
        table.name,
        table.register,
        table.courseNumber,
        table.term,
      )
      .with({
        key_field: "id",
        // NOTE: this template literal is interpreted as raw SQL and therefore must be escaped properly
        text_fields: `'{
          "name": {"tokenizer": {"type": "ngram", "min_gram": 4, "max_gram": 5, "prefix_only": false}},
          "register": {"tokenizer": {"type": "ngram", "min_gram": 2, "max_gram": 4, "prefix_only": false}},
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
    campus: integer()
      .notNull()
      .references(() => campusesT.id),
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

export const subjectsT = pgTable("subjects", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  code: varchar({ length: 6 }).notNull().unique(),
  name: text().notNull(),
});

export const campusesT = pgTable(
  "campuses",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull().unique(),
    code: text().notNull().unique(),
    group: text().notNull(),
  },
  (table) => [uniqueIndex("campus_name_idx").on(table.name)],
);

export const nupathsT = pgTable(
  "nupaths",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    short: varchar({ length: 4 }).notNull().unique(),
    code: varchar({ length: 4 }).notNull().unique(),
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
    name: text().notNull().unique(),
    code: text().notNull().unique(),
    campus: integer()
      .notNull()
      .references(() => campusesT.id),
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
    code: varchar({ length: 10 }).notNull(),
    buildingId: integer()
      .notNull()
      .references(() => buildingsT.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("building_room").on(table.buildingId, table.code),
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
