"use client";

import {
  createTrackerAction,
  deleteTrackerAction,
} from "@/lib/auth/tracking-actions";
import { Switch } from "../ui/switch";
import { Bell, BellOff, BellRing } from "lucide-react";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-client";
import { TooltipContent, Tooltip, TooltipTrigger } from "../ui/tooltip";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Chairskie } from "../icons/Chairskie";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";

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
  const [oneMoreStep, setOneMoreStep] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // TODO: error handling and user feedback

  function onCheck() {
    startTransition(async () => {
      let res;
      if (!checked) {
        res = await createTrackerAction(crn);
      } else {
        res = await deleteTrackerAction(crn);
      }

      if (!res.ok) {
        if (res.msg === "phone number not verified") {
          setOneMoreStep(true);
        }

        return;
      }

      setChecked(!checked);
      if (onCheckedChange) onCheckedChange(!checked);
    });
  }

  if (loading) {
    return (
      <div className="flex w-full justify-end">
        <div className="flex items-center gap-2">
          <Skeleton className="h-[1.125rem] w-8 rounded-full" />
          <Bell className="size-4" />
        </div>
      </div>
    );
  }

  if (!user.guid) {
    return (
      <div className="flex w-full justify-end">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Switch disabled={true} />
              <BellOff className="size-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sign in to be notified when a seat opens</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-end">
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            <Switch
              checked={checked}
              onClick={() => onCheck()}
              className="data-[state=checked]:bg-accent"
              {...props}
            />
            {checked ? (
              <BellRing className="text-accent size-4" />
            ) : !props.disabled ? (
              <Bell className="size-4" />
            ) : (
              <BellOff className="size-4" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {props.disabled && <p>Sections with open seats cannot be tracked</p>}
          {!props.disabled && (
            <p>Track this class to be notified when a seat opens</p>
          )}
        </TooltipContent>
      </Tooltip>
      {oneMoreStep && (
        <Dialog open={true} onOpenChange={() => setOneMoreStep(false)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="flex w-full items-center">
              <DialogTitle>One More Step</DialogTitle>
              <DialogDescription className="text-center">
                Add and verify your phone number to be the first to know when
                seats open up.
              </DialogDescription>
            </DialogHeader>
            <div className="flex w-full items-center justify-center py-4">
              <Chairskie className="w-32" />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/80 w-full"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set("redirect_uri", window.location.toString());
                  router.push("/me/onboarding?" + params.toString());
                }}
              >
                Verify Phone Number
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
