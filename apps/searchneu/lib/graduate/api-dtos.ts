import * as z from "zod";
import type { Requisite } from "@sneu/scraper/types";
import { NUPathEnum, SeasonEnum, StatusEnum } from "./types";

const MIN_YEAR = 1898;
const MAX_YEAR = 3000;

// Mirrors lib/graduate/types.Audit. prereqs/coreqs originate in @sneu/scraper
// and are passed through as JSON without re-validation here.
const AuditCourseSchema = z.object({
  name: z.string(),
  classId: z.string(),
  subject: z.string(),
  prereqs: z.custom<Requisite>().optional(),
  coreqs: z.custom<Requisite>().optional(),
  nupaths: z
    .array(z.custom<NUPathEnum>((v) => typeof v === "string"))
    .optional(),
  numCreditsMin: z.number(),
  numCreditsMax: z.number(),
  id: z.string().nullable(),
  generic: z.boolean().optional(),
});

const AuditTermSchema = z.object({
  season: z.enum(SeasonEnum),
  status: z.enum(StatusEnum),
  classes: z.array(AuditCourseSchema),
  id: z.string().nullable(),
});

const AuditYearSchema = z.object({
  year: z.number(),
  fall: AuditTermSchema,
  spring: AuditTermSchema,
  summer1: AuditTermSchema,
  summer2: AuditTermSchema,
  isSummerFull: z.boolean(),
});

const AuditScheduleSchema = z.object({
  years: z.array(AuditYearSchema),
});

const WhiteboardSchema = z.record(
  z.string(),
  z.object({
    courses: z.string().array(),
    status: z.enum(["not_started", "in_progress", "completed"]),
  }),
);

export const CreateAuditPlanDtoWithoutSchedule = z.strictObject({
  name: z.string(),
  majors: z.string().array().optional(),
  minors: z.string().array().optional(),
  concentration: z.string().optional(),
  catalogYear: z.number().int().min(MIN_YEAR).max(MAX_YEAR).optional(),
  agreeToBetaMajor: z.boolean().optional(),
});

export const CreateAuditPlanDto = CreateAuditPlanDtoWithoutSchedule.extend({
  schedule: AuditScheduleSchema,
});

export const UpdateAuditPlanDto = z.strictObject({
  name: z.string().optional(),
  schedule: AuditScheduleSchema.optional(),
  majors: z.string().array().nullable().optional(),
  minors: z.string().array().nullable().optional(),
  concentration: z.string().nullable().optional(),
  catalogYear: z
    .number()
    .int()
    .min(MIN_YEAR)
    .max(MAX_YEAR)
    .nullable()
    .optional(),
  whiteboard: WhiteboardSchema.optional(),
});

export type CreateAuditPlanInput = z.infer<typeof CreateAuditPlanDto>;
export type UpdateAuditPlanInput = z.infer<typeof UpdateAuditPlanDto>;
