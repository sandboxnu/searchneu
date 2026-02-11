import * as z from "zod";

const MIN_YEAR = 1898;
const MAX_YEAR = 3000;

export const CreateAuditPlanDtoWithoutSchedule = z.strictObject({
  name: z.string(),
  major: z.string().optional(),
  minor: z.string().optional(),
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
  major: z.string().optional(),
  minor: z.string().nullable().optional(),
  concentration: z.string().optional(),
  catalogYear: z.number().int().min(MIN_YEAR).max(MAX_YEAR).optional(),
});

export type CreateAuditPlanInput = z.infer<typeof CreateAuditPlanDto>;
export type UpdateAuditPlanInput = z.infer<typeof UpdateAuditPlanDto>;
