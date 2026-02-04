import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sectionsT } from "./catalog";
import {relations} from "drizzle-orm";
import {auditPlansT} from "./graduate";

export const usersT = pgTable(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    guid: uuid().notNull().unique().defaultRandom(),
    name: text().notNull(),
    email: text().notNull().unique(),
    image: text(),
    subject: varchar({ length: 255 }).notNull().unique(),
    role: varchar({ length: 100 }).notNull().default("user"),
    trackingLimit: integer().notNull().default(12),
    acceptedTerms: timestamp(),
    phoneNumber: text("phone_number").unique(),
    phoneNumberVerified: boolean("phone_number_verified"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("guid_idx").on(table.guid),
    uniqueIndex("sub_idx").on(table.subject),
  ],
);

export const trackersT = pgTable(
  "trackers",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
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

export const notificationsT = pgTable("notifications", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull(),
  trackerId: integer().notNull(),
  method: varchar({ length: 10 }).notNull(),
  message: text(),
  sentAt: timestamp().notNull().defaultNow(),
});

