import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sectionsT } from "./catalog";
import { user as usersT } from "./auth";

export const trackersT = pgTable(
  "tracker",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
      .notNull()
      .references(() => usersT.id),
    sectionId: integer()
      .notNull()
      .references(() => sectionsT.id),
    notificationMethod: varchar({ length: 10 }).notNull().default("SMS"),
    messageCount: integer().notNull().default(0),
    messageLimit: integer().notNull().default(3),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp(),
  },
  (table) => [
    index("tracker_user_idx").on(table.userId),
    index("tracker_section_idx").on(table.sectionId),
  ],
);

export const notificationsT = pgTable("notification", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: text().notNull(),
  trackerId: integer().notNull(),
  method: varchar({ length: 10 }).notNull(),
  message: text(),
  sentAt: timestamp().notNull().defaultNow(),
});
