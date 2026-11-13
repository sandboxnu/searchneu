CREATE TABLE "section_seat_history" (
	"sectionId" integer NOT NULL,
	"observedAt" timestamp NOT NULL,
	"seatCapacity" integer NOT NULL,
	"seatRemaining" integer NOT NULL,
	"waitlistCapacity" integer NOT NULL,
	"waitlistRemaining" integer NOT NULL,
	CONSTRAINT "section_seat_history_sectionId_observedAt_pk" PRIMARY KEY("sectionId","observedAt")
);
--> statement-breakpoint
ALTER TABLE "section_seat_history" ADD CONSTRAINT "section_seat_history_sectionId_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Starting rows for sections already in the catalog. Sections inserted later
-- get theirs from the ingest pass that inserts them.
INSERT INTO "section_seat_history" ("sectionId", "observedAt", "seatCapacity", "seatRemaining", "waitlistCapacity", "waitlistRemaining")
SELECT s."id", now() AT TIME ZONE 'utc', s."seatCapacity", s."seatRemaining", s."waitlistCapacity", s."waitlistRemaining"
FROM "sections" s
JOIN "terms" t ON t."id" = s."termId"
WHERE t."activeUntil" > now() AT TIME ZONE 'utc' AND s."tombstonedAt" IS NULL;
