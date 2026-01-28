import {
    integer,
    json,
    pgTable,
    smallint,
    text,
    timestamp
} from "drizzle-orm/pg-core";
import {usersT} from "./platform";

export const auditPlansT = pgTable("auditPlansT", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    userId: integer("user_id").notNull().references(() => usersT.id, { onDelete: "cascade" }),
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
});

export const graduateMetadataT = pgTable("graduateMetadataT", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().notNull().references(() => usersT.id),
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
        .$onUpdate(() => new Date())
})