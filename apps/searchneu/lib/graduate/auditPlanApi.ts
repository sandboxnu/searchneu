import type { PlanSchedule } from "./types";

/** Audit plan as returned by the API (id, name, schedule, etc.). */
export interface AuditPlan {
  id: number;
  name: string;
  schedule: PlanSchedule;
  majors?: string[] | null;
  minors?: string[] | null;
  concentration?: string | null;
  catalogYear?: number | null;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

async function getBaseUrl(): Promise<string> {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * Creates a new audit plan for the authenticated user.
 * @returns The created plan with id, or throws on error/401
 */
export async function createAuditPlan(body: {
  name: string;
  schedule: PlanSchedule;
  majors?: string[];
  catalogYear?: number;
  concentration?: string;
}): Promise<AuditPlan> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/audit/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<AuditPlan>;
}

/**
 * Updates an existing audit plan's schedule (and optionally other fields).
 * @returns The updated plan, or throws on error/401
 */
export async function updateAuditPlan(
  planId: number,
  body: { schedule?: PlanSchedule; name?: string }
): Promise<AuditPlan> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/audit/plan/${planId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<AuditPlan>;
}
