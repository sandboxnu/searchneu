"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Plan, PlanCourse } from "@/lib/scheduler/types";
import {
  PLACEHOLDER_PLAN_FILTERS,
  PLACEHOLDER_PLAN_COURSES,
} from "@/lib/scheduler/placeholderPlanData";

function FilterChip({
  label,
  value,
  className,
  ...props
}: React.ComponentProps<"span"> & {
  label: string;
  value?: string;
}) {
  const displayText = value ? `${label}: ${value}` : label;
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center rounded-md border border-neu3 bg-neu2 px-2.5 py-1 text-xs font-medium text-neu8",
        className,
      )}
      {...props}
    >
      {displayText}
    </span>
  );
}

function IncludedCourseItem({
  code,
  name,
  category: _category,
  className,
  ...props
}: PlanCourse & React.ComponentProps<"div">) {
  return (
    <div
      role="listitem"
      className={cn(
        "text-neu8 flex min-w-0 overflow-hidden rounded-lg border border-neu3 bg-neu2 text-sm",
        className,
      )}
      {...props}
    >
      <div
        className="w-1 shrink-0 self-stretch rounded-l-lg"
        aria-hidden
      />
      <div className="flex flex-col gap-0.5 px-3 py-2">
        <span className="font-semibold">{code}</span>
        <span className="font-normal">{name}</span>
      </div>
    </div>
  );
}

export function PlanCard(props: {
  plan: Plan;
  selectedCollege: string;
  selectedTerm: string | null;
  onDelete: (planId: string) => void;
}) {
  const { plan, selectedCollege, selectedTerm, onDelete } = props;
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleEdit = () => {
    const params = new URLSearchParams();
    if (selectedTerm) params.set("term", selectedTerm);
    params.set("college", selectedCollege);
    router.push(`/scheduler/generator?${params.toString()}`);
  };

  const handleDeleteClick = () => setDeleteModalOpen(true);

  const handleDeleteConfirm = () => {
    onDelete(plan.id);
    setDeleteModalOpen(false);
  };

  return (
    <>
      <div className="bg-neu1 w-full rounded-lg border border-t-0 px-4 py-4 md:border-t shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">{plan.name}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              Edit Plan
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={handleDeleteClick}
              aria-label="Delete plan"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
        <h3 className="text-neu7 text-xs font-bold">APPLIED FILTERS</h3>
        <div className="flex flex-wrap gap-2">
          {(plan.filters ?? PLACEHOLDER_PLAN_FILTERS).map((filter) => (
            <FilterChip
              key={filter.label}
              label={filter.label}
              value={filter.value}
            />
          ))}
        </div>
        <h3 className="text-neu7 text-xs font-bold">INCLUDED COURSES</h3>
        <div className="grid grid-cols-4 gap-x-4 gap-y-3">
          {(plan.courses ?? PLACEHOLDER_PLAN_COURSES).map((course) => (
            <IncludedCourseItem
              key={course.code}
              code={course.code}
              name={course.name}
              category={course.category}
            />
          ))}
        </div>
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Delete plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{plan.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
