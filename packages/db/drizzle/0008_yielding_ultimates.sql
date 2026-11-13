ALTER TABLE "courses" ADD COLUMN "missingSince" timestamp;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "tombstonedAt" timestamp;--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "missingSince" timestamp;--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "tombstonedAt" timestamp;