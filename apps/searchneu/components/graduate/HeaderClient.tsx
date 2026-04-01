"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuditPlanSummary, HydratedAuditPlan } from "@/lib/graduate/types";
import NewPlanModal from "@/components/graduate/modal/NewPlanModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PencilIcon, Trash2Icon, CopyIcon, ShareIcon } from "lucide-react";
import { deletePlanAction } from "@/lib/graduate/actions";

interface HeaderClientProps {
  plans: AuditPlanSummary[];
  currentPlan: HydratedAuditPlan;
}

export function HeaderClient({ plans, currentPlan }: HeaderClientProps) {
  const router = useRouter();
  const [showNewPlan, setShowNewPlan] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${currentPlan.name}"?`)) {
      return;
    }

    const result = await deletePlanAction(currentPlan.id);

    if (result.ok) {
      toast(`Plan "${currentPlan.name}" deleted`);
      const remaining = plans.filter((p) => p.id !== currentPlan.id);
      if (remaining.length > 0) {
        router.push(`/graduate/${remaining[0].id}`);
      } else {
        router.push("/graduate");
      }
    } else {
      toast.error(result.msg ?? "Failed to delete plan");
    }
  }

  function handleEdit() {
    toast("Edit plan coming soon");
  }

  function handleCopy() {
    toast("Copy plan coming soon");
  }

  function handleShare() {
    toast("Share plan coming soon");
  }

  return (
    <div className="border-neu25 bg-neu1 mt-3 rounded-lg border p-6">
      <div className="flex items-start gap-5">
        <div className="flex flex-col gap-4">
          <Select
            value={String(currentPlan.id)}
            onValueChange={(id) => router.push(`/graduate/${id}`)}
          >
            <SelectTrigger className="w-full min-w-48">
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={String(plan.id)}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowNewPlan(true)}
              className="rounded-2xl"
            >
              + New Plan
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="size-8 rounded-full p-0"
              onClick={handleEdit}
              title="Edit plan"
            >
              <PencilIcon className="size-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="size-8 rounded-full p-0"
              onClick={handleDelete}
              title="Delete plan"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="size-8 rounded-full p-0"
              onClick={handleCopy}
              title="Copy plan"
            >
              <CopyIcon className="size-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="size-8 rounded-full p-0"
              onClick={handleShare}
              title="Share plan"
            >
              <ShareIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="border-neu4 self-stretch border-l" />

        <div className="grid flex-1 grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-1">
            <span className="text-neu6 text-xs font-bold uppercase">
              Majors
            </span>
            {currentPlan.majors.length > 0 ? (
              currentPlan.majors.map((major) => (
                <div key={major.name} className="flex items-baseline gap-2">
                  <span className="text-neu7 text-lg leading-normal font-semibold">
                    {major.name}
                  </span>
                  {currentPlan.concentration && (
                    <span className="text-neu6 text-sm leading-normal font-normal italic">
                      {currentPlan.concentration}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <span className="text-neu6 text-sm">None</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-neu6 text-xs font-bold uppercase">
              Minors
            </span>
            {currentPlan.minors.length > 0 ? (
              currentPlan.minors.map((minor) => (
                <span
                  key={minor.name}
                  className="text-neu7 text-lg leading-normal font-semibold"
                >
                  {minor.name}
                </span>
              ))
            ) : (
              <span className="text-neu6 text-sm">None</span>
            )}
          </div>
        </div>
      </div>
      <NewPlanModal open={showNewPlan} onOpenChange={setShowNewPlan} />
    </div>
  );
}
