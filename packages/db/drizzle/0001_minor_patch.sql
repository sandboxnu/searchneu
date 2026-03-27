CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'user',
	"phone_number" text,
	"phone_number_verified" boolean,
	"accepted_terms" timestamp,
	"tracking_limit" integer DEFAULT 12,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "buildings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"code" text NOT NULL,
	"campus" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "buildings_name_unique" UNIQUE("name"),
	CONSTRAINT "buildings_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "campuses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "campuses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"code" text NOT NULL,
	"group" text NOT NULL,
	CONSTRAINT "campuses_name_unique" UNIQUE("name"),
	CONSTRAINT "campuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "course_nupath_join" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "course_nupath_join_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"courseId" integer NOT NULL,
	"nupathId" integer NOT NULL,
	CONSTRAINT "course_nupath_join_unique" UNIQUE("courseId","nupathId")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "courses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"termId" integer NOT NULL,
	"name" text NOT NULL,
	"subject" integer NOT NULL,
	"courseNumber" varchar(6) NOT NULL,
	"register" text NOT NULL,
	"description" text NOT NULL,
	"minCredits" numeric NOT NULL,
	"maxCredits" numeric NOT NULL,
	"prereqs" jsonb NOT NULL,
	"coreqs" jsonb NOT NULL,
	"postreqs" jsonb NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "term_course" UNIQUE("termId","subject","courseNumber")
);
--> statement-breakpoint
CREATE TABLE "meeting_times" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "meeting_times_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"termId" integer NOT NULL,
	"sectionId" integer NOT NULL,
	"roomId" integer,
	"days" integer[] NOT NULL,
	"startTime" integer NOT NULL,
	"endTime" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_time" UNIQUE("termId","sectionId","days","startTime","endTime")
);
--> statement-breakpoint
CREATE TABLE "nupaths" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "nupaths_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"short" varchar(4) NOT NULL,
	"code" varchar(4) NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "nupaths_short_unique" UNIQUE("short"),
	CONSTRAINT "nupaths_code_unique" UNIQUE("code"),
	CONSTRAINT "nupaths_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rooms_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(10) NOT NULL,
	"buildingId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"termId" integer NOT NULL,
	"courseId" integer NOT NULL,
	"crn" varchar(5) NOT NULL,
	"faculty" text NOT NULL,
	"seatCapacity" integer NOT NULL,
	"seatRemaining" integer NOT NULL,
	"waitlistCapacity" integer NOT NULL,
	"waitlistRemaining" integer NOT NULL,
	"classType" text NOT NULL,
	"honors" boolean NOT NULL,
	"campus" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "term_crn" UNIQUE("termId","crn")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subjects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(6) NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "subjects_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "terms" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "terms_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"term" varchar(6) NOT NULL,
	"partOfTerm" varchar(3) DEFAULT '1' NOT NULL,
	"name" text NOT NULL,
	"activeUntil" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "term_part_of_term" UNIQUE("term","partOfTerm")
);
--> statement-breakpoint
CREATE TABLE "audit_metadata" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_metadata_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" text NOT NULL,
	"academicYear" smallint,
	"graduateYear" smallint,
	"catalogYear" smallint,
	"majors" text[],
	"minors" text[],
	"coopCycle" text,
	"concentration" text,
	"coursesCompleted" json,
	"coursesTransferred" json,
	"primaryPlanId" integer,
	"starredPlanId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_plans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_plans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"userId" text NOT NULL,
	"schedule" json,
	"majors" text[],
	"minors" text[],
	"concentration" text,
	"catalogYear" smallint,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notification_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" text NOT NULL,
	"trackerId" integer NOT NULL,
	"method" varchar(10) NOT NULL,
	"message" text,
	"sentAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracker" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tracker_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" text NOT NULL,
	"sectionId" integer NOT NULL,
	"notificationMethod" varchar(10) DEFAULT 'SMS' NOT NULL,
	"messageCount" integer DEFAULT 0 NOT NULL,
	"messageLimit" integer DEFAULT 3 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "favorited_schedule_sections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "favorited_schedule_sections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"favoritedScheduleId" integer NOT NULL,
	"sectionId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorited_schedules" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "favorited_schedules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"planId" integer NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_schedule_sections" (
	"scheduleId" integer NOT NULL,
	"sectionId" integer NOT NULL,
	CONSTRAINT "generated_schedule_sections_scheduleId_sectionId_pk" PRIMARY KEY("scheduleId","sectionId")
);
--> statement-breakpoint
CREATE TABLE "generated_schedules" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "generated_schedules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" text NOT NULL,
	"termId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "saved_plan_courses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "saved_plan_courses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"planId" integer NOT NULL,
	"courseId" integer NOT NULL,
	"isLocked" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_plan_sections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "saved_plan_sections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"savedPlanCourseId" integer NOT NULL,
	"sectionId" integer NOT NULL,
	"isHidden" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_plans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "saved_plans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" text NOT NULL,
	"termId" integer NOT NULL,
	"name" text NOT NULL,
	"numCourses" integer DEFAULT 4,
	"startTime" integer,
	"endTime" integer,
	"freeDays" text[] DEFAULT '{}' NOT NULL,
	"includeHonorsSections" boolean DEFAULT true NOT NULL,
	"includeRemoteSections" boolean DEFAULT true NOT NULL,
	"hideFilledSections" boolean DEFAULT false NOT NULL,
	"campus" integer DEFAULT 1 NOT NULL,
	"nupaths" integer[] DEFAULT '{}' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_campus_campuses_id_fk" FOREIGN KEY ("campus") REFERENCES "public"."campuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_nupath_join" ADD CONSTRAINT "course_nupath_join_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_nupath_join" ADD CONSTRAINT "course_nupath_join_nupathId_nupaths_id_fk" FOREIGN KEY ("nupathId") REFERENCES "public"."nupaths"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_termId_terms_id_fk" FOREIGN KEY ("termId") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_subject_subjects_id_fk" FOREIGN KEY ("subject") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_times" ADD CONSTRAINT "meeting_times_termId_terms_id_fk" FOREIGN KEY ("termId") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_times" ADD CONSTRAINT "meeting_times_sectionId_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_times" ADD CONSTRAINT "meeting_times_roomId_rooms_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_buildingId_buildings_id_fk" FOREIGN KEY ("buildingId") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_termId_terms_id_fk" FOREIGN KEY ("termId") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_campus_campuses_id_fk" FOREIGN KEY ("campus") REFERENCES "public"."campuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_metadata" ADD CONSTRAINT "audit_metadata_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_metadata" ADD CONSTRAINT "audit_metadata_primaryPlanId_audit_plans_id_fk" FOREIGN KEY ("primaryPlanId") REFERENCES "public"."audit_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_metadata" ADD CONSTRAINT "audit_metadata_starredPlanId_audit_plans_id_fk" FOREIGN KEY ("starredPlanId") REFERENCES "public"."audit_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_plans" ADD CONSTRAINT "audit_plans_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker" ADD CONSTRAINT "tracker_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker" ADD CONSTRAINT "tracker_sectionId_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorited_schedule_sections" ADD CONSTRAINT "favorited_schedule_sections_favoritedScheduleId_favorited_schedules_id_fk" FOREIGN KEY ("favoritedScheduleId") REFERENCES "public"."favorited_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorited_schedule_sections" ADD CONSTRAINT "favorited_schedule_sections_sectionId_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorited_schedules" ADD CONSTRAINT "favorited_schedules_planId_saved_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."saved_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_schedule_sections" ADD CONSTRAINT "generated_schedule_sections_scheduleId_generated_schedules_id_fk" FOREIGN KEY ("scheduleId") REFERENCES "public"."generated_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_schedule_sections" ADD CONSTRAINT "generated_schedule_sections_sectionId_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_schedules" ADD CONSTRAINT "generated_schedules_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_schedules" ADD CONSTRAINT "generated_schedules_termId_terms_id_fk" FOREIGN KEY ("termId") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_plan_courses" ADD CONSTRAINT "saved_plan_courses_planId_saved_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."saved_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_plan_sections" ADD CONSTRAINT "saved_plan_sections_savedPlanCourseId_saved_plan_courses_id_fk" FOREIGN KEY ("savedPlanCourseId") REFERENCES "public"."saved_plan_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_plan_sections" ADD CONSTRAINT "saved_plan_sections_sectionId_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_plans" ADD CONSTRAINT "saved_plans_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_plans" ADD CONSTRAINT "saved_plans_termId_terms_id_fk" FOREIGN KEY ("termId") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "campus_name_idx" ON "campuses" USING btree ("name");--> statement-breakpoint
CREATE INDEX "course_nupath_join_course_idx" ON "course_nupath_join" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX "courses_search_idx" ON "courses" USING bm25 ("id","name","register","courseNumber","termId") WITH (key_field=id,text_fields='{
          "name": {"tokenizer": {"type": "ngram", "min_gram": 4, "max_gram": 5, "prefix_only": false}},
          "register": {"tokenizer": {"type": "ngram", "min_gram": 2, "max_gram": 4, "prefix_only": false}},
          "courseNumber": {"fast": true}
        }');--> statement-breakpoint
CREATE INDEX "section_meeting_idx" ON "meeting_times" USING btree ("sectionId");--> statement-breakpoint
CREATE INDEX "room_meeting_idx" ON "meeting_times" USING btree ("roomId");--> statement-breakpoint
CREATE UNIQUE INDEX "nupath_short_idx" ON "nupaths" USING btree ("short");--> statement-breakpoint
CREATE INDEX "building_idx" ON "rooms" USING btree ("buildingId");--> statement-breakpoint
CREATE INDEX "crn_idx" ON "sections" USING btree ("crn");--> statement-breakpoint
CREATE INDEX "term_idx" ON "sections" USING btree ("termId");--> statement-breakpoint
CREATE INDEX "audit_metadata_user_id_idx" ON "audit_metadata" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "audit_plans_user_id_idx" ON "audit_plans" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "tracker_user_idx" ON "tracker" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "tracker_section_idx" ON "tracker" USING btree ("sectionId");--> statement-breakpoint
CREATE INDEX "fss_favorited_schedule_idx" ON "favorited_schedule_sections" USING btree ("favoritedScheduleId");--> statement-breakpoint
CREATE INDEX "fs_plan_idx" ON "favorited_schedules" USING btree ("planId");--> statement-breakpoint
CREATE INDEX "gss_section_idx" ON "generated_schedule_sections" USING btree ("sectionId");--> statement-breakpoint
CREATE INDEX "gs_user_idx" ON "generated_schedules" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "gs_term_idx" ON "generated_schedules" USING btree ("termId");--> statement-breakpoint
CREATE INDEX "spc_plan_idx" ON "saved_plan_courses" USING btree ("planId");--> statement-breakpoint
CREATE UNIQUE INDEX "spc_plan_course_unique" ON "saved_plan_courses" USING btree ("planId","courseId");--> statement-breakpoint
CREATE INDEX "sps_saved_plan_course_idx" ON "saved_plan_sections" USING btree ("savedPlanCourseId");--> statement-breakpoint
CREATE UNIQUE INDEX "sps_course_section_unique" ON "saved_plan_sections" USING btree ("savedPlanCourseId","sectionId");--> statement-breakpoint
CREATE INDEX "sp_user_idx" ON "saved_plans" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sp_term_idx" ON "saved_plans" USING btree ("termId");