CREATE TABLE "catalog_majors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "catalog_majors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"totalCreditsRequired" integer NOT NULL,
	"yearVersion" integer NOT NULL,
	"requirementSections" jsonb NOT NULL,
	"concentrationOptions" jsonb NOT NULL,
	"minConcentrationOptions" integer DEFAULT 0 NOT NULL,
	"templateOptions" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_minors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "catalog_minors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"totalCreditsRequired" integer NOT NULL,
	"yearVersion" integer NOT NULL,
	"requirementSections" jsonb NOT NULL,
	"concentrationOptions" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
