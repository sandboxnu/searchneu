import {
    integer,
    json,
    pgTable,
    smallint,
    text,
    timestamp
} from "drizzle-orm/pg-core";
import {usersT} from "./platform";
import {relations} from "drizzle-orm";

export const plansT = pgTable("plans", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    userId: integer("user_id").notNull().references(() => usersT.id, { onDelete: "cascade" }),
    schedule: json().$type<Schedule2<null>>().notNull(),
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

export const graduateMetaDataT = pgTable("userToPlan", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().notNull().references(() => usersT.id),
    academicYear: smallint(),
    graduateYear: smallint(),
    catalogYear: smallint(),
    majors: text().array(),
    minors: text().array(),
    coopCycle: text(),
    concentration: text(),
    coursesCompleted: json().$type<ScheduleCourse[]>(),
    coursesTransferred: json().$type<ScheduleCourse2<null>>(),
    primaryPlanId: integer().references(() => plansT.id),
    starredPlanId: integer().references(() => plansT.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date())
})

export const planRelations = relations(plansT, ({ one }) => ({
    user: one(usersT, {
        fields: [plansT.userId],
        references: [usersT.id],
    })
}));