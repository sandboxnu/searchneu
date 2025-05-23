"use client";

import {
  createSeatTrackerAction,
  deleteSeatTrackerAction,
} from "@/lib/auth/tracking-actions";
import { Switch } from "../ui/switch";
import { Bell } from "lucide-react";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-client";
import { TooltipContent, Tooltip, TooltipTrigger } from "../ui/tooltip";

export function TrackingSwitch({
  crn,
  inital,
  onCheckedChange,
  ...props
}: {
  crn: string;
  inital: boolean;
} & React.ComponentProps<typeof Switch>) {
  const { user, isPending: loading } = useAuth();
  const [checked, setChecked] = useState(inital);
  const [isPending, startTransition] = useTransition();

  // TODO: error handling and user feedback

  function onCheck() {
    startTransition(async () => {
      let res;
      if (!checked) {
        res = await createSeatTrackerAction(crn);
      } else {
        res = await deleteSeatTrackerAction(crn);
      }

      if (!res.ok) {
        return;
      }

      setChecked(!checked);
      if (onCheckedChange) onCheckedChange(!checked);
    });
  }

  if (loading) {
    return;
  }

  if (!user.guid) {
    return (
      <div className="flex w-full items-end justify-end gap-2">
        <p className="text-sm">Sign in to track</p>
        <Bell className="size-4" />
      </div>
    );
  }

  if (!user.phoneVerified) {
    return;
  }

  return (
    <div className="flex w-full items-center justify-end gap-2">
      {isPending && <Loader2 className="size-4 animate-spin" />}

      <Switch checked={checked} onClick={() => onCheck()} {...props} />

      <Tooltip>
        <TooltipTrigger asChild>
          <Bell className="size-4" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Be notified when a seat opens in this section</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
