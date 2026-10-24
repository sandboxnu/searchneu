"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { CopyIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import NewPlanModal from "@/components/graduate/modal/NewPlanModal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NoPlanSelectedProps {
  isGuest: boolean;
}

/** Onboarding screen for users (guest or signed in) with no plan created or selected. */
export function NoPlanSelected({ isGuest }: NoPlanSelectedProps) {
  const [showNewPlan, setShowNewPlan] = useState(false);
  // Mounting the modal is heavy; a transition lets the click paint first
  const [, startTransition] = useTransition();

  // --sidebar-w is shared by the header's left column and the sidebar below so they stay aligned
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 [--sidebar-w:360px]">
      {/* The first track is 1px short of --sidebar-w to account for the card's own border */}
      <div className="border-neu25 bg-neu0 mt-3 grid grid-cols-[calc(var(--sidebar-w)-1px)_1fr] rounded-lg border">
        <div className="relative flex flex-col gap-4 p-6">
          {/* inset divider: sits on the cell's right edge, which is the sidebar edge */}
          <div className="border-neu3 absolute inset-y-6 right-0 border-r" />
          <Select disabled>
            <SelectTrigger className="border-neu4 w-full min-w-48">
              <SelectValue placeholder="Select Plan" />
            </SelectTrigger>
            <SelectContent />
          </Select>

          <div className="flex items-center gap-1.5">
            <Button
              onClick={() => startTransition(() => setShowNewPlan(true))}
              className="h-9 gap-1 px-3 text-sm font-semibold"
            >
              <PlusIcon className="size-3" />
              New Plan
            </Button>
            {[
              { title: "Edit plan", Icon: PencilIcon },
              { title: "Delete plan", Icon: Trash2Icon },
              { title: "Copy plan", Icon: CopyIcon },
            ].map(({ title, Icon }) => (
              <Button
                key={title}
                variant="secondary"
                size="sm"
                className="size-8 rounded-full p-0"
                title={title}
                disabled
              >
                <Icon className="size-3.5" />
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[2fr_1fr] p-6">
          <span className="text-neu6 text-xs font-bold uppercase">Majors</span>
          <span className="text-neu6 text-xs font-bold uppercase">Minors</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-1 pb-4">
        <div className="border-neu25 bg-neu0 w-(--sidebar-w) flex-shrink-0 rounded-lg border" />
        <div className="border-neu4 bg-neu0 flex min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-lg border px-2.5 py-5">
          <div className="relative h-[368px] w-[304px]">
            <Image
              src="/images/graduate/no-plan-selected.svg"
              alt=""
              width={322}
              height={386}
              className="absolute top-0 left-0 max-w-none"
              unoptimized
            />
          </div>
          <div className="flex flex-col gap-2.5 text-center">
            <p className="text-neu8 text-xl leading-[1.2] font-bold">
              No Plan Selected
            </p>
            <p className="text-neu5 text-sm">
              Please Select Plan to View Dashboard
            </p>
          </div>
        </div>
      </div>

      <NewPlanModal
        open={showNewPlan}
        onOpenChange={setShowNewPlan}
        isGuest={isGuest}
      />
    </div>
  );
}
