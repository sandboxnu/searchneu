"use client";

import React from "react";
import type { Plan as PlanType, PlanCourse } from "../../../lib/graduate/types";
import { ScheduleYear } from "./ScheduleYear";

interface PlanProps {
  plan: PlanType;
  onRemoveCourse?: (course: PlanCourse) => void;
}

export function Plan({ plan, onRemoveCourse }: PlanProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        {plan.schedule.years.map((scheduleYear) => (
          <ScheduleYear
            key={scheduleYear.year}
            scheduleYear={scheduleYear}
            onRemoveCourse={onRemoveCourse}
          />
        ))}
      </div>
    </div>
  );
}
