"use client";

import {
  createTrackerAction,
  deleteTrackerAction,
} from "@/lib/auth/tracking-actions";
import { Switch } from "../ui/switch";
import { TriangleAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { useAuth } from "@/lib/auth/client";
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
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function TrackingSwitch({
  sectionId,
  inital,
  isTermActive,
  onCheckedChange,
  ...props
}: {
  sectionId: number;
  inital: boolean;
  isTermActive: boolean;
} & React.ComponentProps<typeof Switch>) {
  const { user, isPending: loading } = useAuth();
  const [checked, setChecked] = useState(inital);
  const [oneMoreStep, setOneMoreStep] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const disabled = checked ? false : props.disabled;

  function onCheck() {
    startTransition(async () => {
      let res;
      if (!checked) {
        res = await createTrackerAction(sectionId);
      } else {
        res = await deleteTrackerAction(sectionId);
      }

      if (!res.ok) {
        if (res.msg === "phone number not verified") {
          setOneMoreStep(true);
          return;
        }

        if (res.msg === "tracker limit reached") {
          toast(
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-4" />
              <p>
                Seat tracking limit reached.{" "}
                <Link href="/" className="text-blue hover:text-blue/80">
                  Learn More
                </Link>
              </p>
            </div>,
          );
          return;
        }

        toast(
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-4" />
            <p>Internal server error. Try again later.</p>
          </div>,
        );
        return;
      }

      setChecked(!checked);
      if (onCheckedChange) onCheckedChange(!checked);
    });
  }

  if (!isTermActive) {
    return (
      <div className="flex w-full justify-center">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Switch disabled={true} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Term is view only</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex w-full justify-center">
        <div className="flex items-center gap-2">
          <Skeleton className="h-[1.125rem] w-8 rounded-full" />
        </div>
      </div>
    );
  }

  if (!user.guid) {
    return (
      <div className="flex w-full justify-center">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Switch disabled={true} />
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
    <div className="flex w-full justify-center">
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Switch
              checked={checked}
              onClick={() => onCheck()}
              className={cn("data-[state=checked]:bg-accent", {
                "animate-pulse": isPending,
              })}
              {...props}
              disabled={disabled}
            />
            {/* {isPending && <Loader2 className="size-4 animate-spin" />} */}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {disabled ? (
            <p>Sections with open seats cannot be tracked</p>
          ) : (
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
                  router.push("/me/link?" + params.toString());
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
