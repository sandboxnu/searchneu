import * as z from "zod";
import { Schedule } from "./types"

const MIN_YEAR = 1898;
const MAX_YEAR = 3000;


export const CreateAuditPlanDtoWithoutSchedule = z.object({
  name: z.string(),
  major: z.string().optional(),
  minor: z.string().optional(),
  concentration: z.string().optional(),
  catalogYear: z.number().int().min(MIN_YEAR).max(MAX_YEAR).optional(),
  agreeToBetaMajor: z.boolean().optional(),
});

export const CreateAuditPlanDto = CreateAuditPlanDtoWithoutSchedule.extend({
  schedule: z.custom<Schedule<null>>
});

export const UpdateAuditPlanDto = z.object({
  name: z.string().optional(),
  schedule: z.custom<Schedule<null>>().optional(),
  major: z.string().optional(),
  minor: z.string().nullable().optional(),
  concentration: z.string().optional(),
  catalogYear: z.number().int().min(MIN_YEAR).max(MAX_YEAR).optional(),
});

export type CreatePlanInput = z.infer<typeof CreateAuditPlanDto>;
export type UpdatePlanInput = z.infer<typeof UpdateAuditPlanDto>;