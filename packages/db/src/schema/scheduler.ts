import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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

export const savedPlansT = pgTable(
  "saved_plans",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
      .notNull()
      .references(() => usersT.id, { onDelete: "cascade" }),
    term: varchar({ length: 6 })
      .notNull()
      .references(() => termsT.term, { onDelete: "cascade" }),
    name: text().notNull(),
    startTime: integer(),
    endTime: integer(),
    freeDays: text().array().notNull().default([]),
    includeHonorsSections: boolean().notNull().default(false),
    includeRemoteSections: boolean().notNull().default(true),
    hideFilledSections: boolean().notNull().default(false),
    campuses: integer(),
    nupaths: integer().array().notNull().default([]),
    
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("sp_user_idx").on(table.userId),
    index("sp_term_idx").on(table.term),
  ],
);

export const savedPlanCoursesT = pgTable(
  "saved_plan_courses",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    planId: integer()
      .notNull()
      .references(() => savedPlansT.id, { onDelete: "cascade" }),
    courseId: integer().notNull(),
    isLocked: boolean().notNull().default(false),
    
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("spc_plan_idx").on(table.planId),
  ],
);

export const savedPlanSectionsT = pgTable(
  "saved_plan_sections",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    savedPlanCourseId: integer()
      .notNull()
      .references(() => savedPlanCoursesT.id, { onDelete: "cascade" }),
    sectionId: integer()
      .notNull()
      .references(() => sectionsT.id, { onDelete: "cascade" }),
    isHidden: boolean().notNull().default(false),
    
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("sps_saved_plan_course_idx").on(table.savedPlanCourseId),
  ],
);

export const favoritedSchedulesT = pgTable(
  "favorited_schedules",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    planId: integer()
      .notNull()
      .references(() => savedPlansT.id, { onDelete: "cascade" }),
    name: text().notNull(),
    
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("fs_plan_idx").on(table.planId),
  ],
);

export const favoritedScheduleSectionsT = pgTable(
  "favorited_schedule_sections",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    favoritedScheduleId: integer()
      .notNull()
      .references(() => favoritedSchedulesT.id, { onDelete: "cascade" }),
    sectionId: integer()
      .notNull()
      .references(() => sectionsT.id, { onDelete: "cascade" }),
    
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("fss_favorited_schedule_idx").on(table.favoritedScheduleId),
  ],
);

// Relations
export const savedPlansRelations = relations(savedPlansT, ({ many }) => ({
  courses: many(savedPlanCoursesT),
}));

export const savedPlanCoursesRelations = relations(savedPlanCoursesT, ({ one, many }) => ({
  plan: one(savedPlansT, {
    fields: [savedPlanCoursesT.planId],
    references: [savedPlansT.id],
  }),
  sections: many(savedPlanSectionsT),
}));

export const savedPlanSectionsRelations = relations(savedPlanSectionsT, ({ one }) => ({
  course: one(savedPlanCoursesT, {
    fields: [savedPlanSectionsT.savedPlanCourseId],
    references: [savedPlanCoursesT.id],
  }),
}));
