import * as z from "zod";

const MIN_YEAR = 1898;
const MAX_YEAR = 3000;

export const CreateAuditPlanDtoWithoutSchedule = z.strictObject({
  name: z.string(),
  majors: z.string().array().optional(),
  minors: z.string().array().optional(),
  concentration: z.string().optional(),
  catalogYear: z.number().int().min(MIN_YEAR).max(MAX_YEAR).optional(),
  agreeToBetaMajor: z.boolean().optional(),
});

export const CreateAuditPlanDto = CreateAuditPlanDtoWithoutSchedule.extend({
  schedule: z.any(),
});

export const UpdateAuditPlanDto = z.strictObject({
  name: z.string().optional(),
  schedule: z.any().optional(),
  majors: z.string().array().nullable().optional(),
  minors: z.string().array().nullable().optional(),
  concentration: z.string().nullable().optional(),
  catalogYear: z.number().int().min(MIN_YEAR).max(MAX_YEAR).nullable().optional(),
});

export type CreateAuditPlanInput = z.infer<typeof CreateAuditPlanDto>;
export type UpdateAuditPlanInput = z.infer<typeof UpdateAuditPlanDto>;
