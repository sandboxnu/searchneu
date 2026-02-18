import {
  index,
  integer,
  json,
  pgTable,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user as usersT } from "./auth";

export const auditPlansT = pgTable(
  "audit_plans",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    userId: text()
      .notNull()
      .references(() => usersT.id, { onDelete: "cascade" }),
    schedule: json(),
    major: text(),
    minor: text(),
    concentration: text(),
    catalogYear: smallint(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("audit_plans_user_id_idx").on(table.userId)],
);

export const auditMetadataT = pgTable(
  "audit_metadata",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
      .notNull()
      .references(() => usersT.id, { onDelete: "cascade" }),
    academicYear: smallint(),
    graduateYear: smallint(),
    catalogYear: smallint(),
    majors: text().array(),
    minors: text().array(),
    coopCycle: text(),
    concentration: text(),
    coursesCompleted: json(),
    coursesTransferred: json(),
    primaryPlanId: integer().references(() => auditPlansT.id),
    starredPlanId: integer().references(() => auditPlansT.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },

  (table) => [index("audit_metadata_user_id_idx").on(table.userId)],
);
