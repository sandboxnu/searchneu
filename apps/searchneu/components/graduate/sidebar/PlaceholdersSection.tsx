"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { SIDEBAR_COURSE_PREFIX } from "@/lib/graduate/planUtils";
import { NUPATH_CODES, NUPATH_DISPLAY } from "@/lib/graduate/requirementUtils";
import {
  createPlaceholderCourse,
  DEFAULT_PLACEHOLDER_CREDITS,
  ELECTIVE_PLACEHOLDERS,
  PLACEHOLDER_CREDIT_OPTIONS,
} from "@/lib/graduate/placeholderUtils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuditCourseCard } from "../dnd/AuditCourseCard";

const CUSTOM_PLACEHOLDER_NAME = "Custom Placeholder";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-neu6 text-xs font-semibold">{children}</span>;
}

/**
 * Draggable placeholder courses, for when a student knows they need, say, a
 * Writing Intensive course or an elective, but has not picked the class yet.
 */
export function PlaceholdersSection() {
  const [open, setOpen] = useState(true);
  const [credits, setCredits] = useState(DEFAULT_PLACEHOLDER_CREDITS);
  const [nupath, setNupath] = useState(NUPATH_CODES[0]);
  const [customName, setCustomName] = useState("");

  // Sidebar cards need a unique dnd id; the course gets a new id on drop
  const sidebarCourse = (key: string, name: string, nupathCode?: string) => ({
    ...createPlaceholderCourse({ name, credits, nupath: nupathCode }),
    id: `${SIDEBAR_COURSE_PREFIX}placeholder-${key}`,
  });

  return (
    <div className="select-none">
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <span className="text-neu7 text-xs font-bold tracking-wide uppercase">
          General Placeholders
        </span>
        {open ? (
          <ChevronUp className="text-neu5 h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="text-neu5 h-4 w-4 shrink-0" />
        )}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-3">
          <p className="text-neu6 text-xs italic">
            Not sure which class you&apos;ll take yet? Drag a placeholder into a
            term to save its spot. It counts toward your credits and NUPaths.
          </p>

          <div className="flex items-center justify-between gap-2">
            <FieldLabel>Credits</FieldLabel>
            <Select
              value={String(credits)}
              items={PLACEHOLDER_CREDIT_OPTIONS.map((c) => ({
                value: String(c),
                label: String(c),
              }))}
              onValueChange={(v) => setCredits(Number(v))}
            >
              <SelectTrigger className="border-neu2 bg-neu1 text-neu8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACEHOLDER_CREDIT_OPTIONS.map((c) => (
                  <SelectItem key={c} value={String(c)}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel>Electives</FieldLabel>
            {ELECTIVE_PLACEHOLDERS.map((name) => (
              <AuditCourseCard key={name} course={sidebarCourse(name, name)} />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel>NUPath</FieldLabel>
            <Select
              value={nupath}
              items={NUPATH_CODES.map((code) => ({
                value: code,
                label: `${code} - ${NUPATH_DISPLAY[code]}`,
              }))}
              onValueChange={(v) => {
                if (v) setNupath(v);
              }}
            >
              <SelectTrigger className="border-neu2 bg-neu1 text-neu8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NUPATH_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code} - {NUPATH_DISPLAY[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AuditCourseCard
              course={sidebarCourse("nupath", NUPATH_DISPLAY[nupath], nupath)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel>Custom</FieldLabel>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Name it, e.g. CS Elective"
              maxLength={40}
              className="text-xs md:text-xs"
            />
            <AuditCourseCard
              course={sidebarCourse(
                "custom",
                customName.trim() || CUSTOM_PLACEHOLDER_NAME,
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
