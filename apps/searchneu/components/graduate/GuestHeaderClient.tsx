"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PencilIcon, Trash2Icon, CopyIcon, ShareIcon } from "lucide-react";
import { useLocalStorage } from "@/lib/graduate/useLocalStorage";
import { CreateAuditPlanInput } from "@/lib/graduate/api-dtos";

export function GuestHeaderClient({}) {
  const router = useRouter();

  const [guestPlan] = useLocalStorage<CreateAuditPlanInput | null>(
    "guest-plan",
    null,
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleDelete() {
    if (!confirm(`Delete "${guestPlan?.name}"?`)) {
      return;
    }
    window.localStorage.removeItem("guest-plan");

    if (window.localStorage.getItem("guest-plan") === null) {
      toast(`Plan "${guestPlan?.name}" deleted`);
      router.push("/graduate");
    } else {
      toast.error(`Failed to delete "${guestPlan?.name}"`);
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
          <Select value={String(1)}>
            <SelectTrigger className="w-full min-w-48">
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={1} value={String(1)}>
                {mounted && guestPlan ? guestPlan.name : "Guest Plan"}
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Button
              variant="destructive"
              size="sm"
              className="rounded-2xl"
              disabled={true}
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
              disabled={true}
            >
              <CopyIcon className="size-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="size-8 rounded-full p-0"
              onClick={handleShare}
              title="Share plan"
              disabled={true}
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
            {mounted &&
            guestPlan &&
            guestPlan.majors &&
            guestPlan.majors.length > 0 ? (
              guestPlan.majors.map((major) => (
                <span
                  key={major}
                  className="text-neu7 text-lg leading-normal font-semibold"
                >
                  {String(major)}
                </span>
              ))
            ) : (
              <span className="text-neu6 text-sm">None</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-neu6 text-xs font-bold uppercase">
              Minors
            </span>
            {mounted &&
            guestPlan &&
            guestPlan.minors &&
            guestPlan.minors.length > 0 ? (
              guestPlan.minors.map((minor) => (
                <span
                  key={minor}
                  className="text-neu7 text-lg leading-normal font-semibold"
                >
                  {String(minor)}
                </span>
              ))
            ) : (
              <span className="text-neu6 text-sm">None</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
