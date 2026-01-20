import {
    integer,
    json,
    pgTable,
    smallint,
    text,
    timestamp
} from "drizzle-orm/pg-core";
import {usersT} from "./platform";

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
