CREATE TABLE "ingest_drift" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ingest_drift_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"runId" integer NOT NULL,
	"kind" text NOT NULL,
	"entity" text NOT NULL,
	"key" text NOT NULL,
	"detail" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingest_runs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ingest_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"term" varchar(6) NOT NULL,
	"pass" text NOT NULL,
	"mode" text NOT NULL,
	"status" text NOT NULL,
	"startedAt" timestamp NOT NULL,
	"finishedAt" timestamp DEFAULT now() NOT NULL,
	"sweepCount" integer,
	"sweepReported" integer,
	"sweepDuplicates" integer,
	"detailTasks" integer,
	"detailFailures" integer,
	"stats" jsonb,
	"violations" jsonb,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "ingest_drift" ADD CONSTRAINT "ingest_drift_runId_ingest_runs_id_fk" FOREIGN KEY ("runId") REFERENCES "public"."ingest_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ingest_drift_run_idx" ON "ingest_drift" USING btree ("runId");--> statement-breakpoint
CREATE INDEX "ingest_drift_kind_idx" ON "ingest_drift" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "ingest_runs_term_idx" ON "ingest_runs" USING btree ("term","startedAt");