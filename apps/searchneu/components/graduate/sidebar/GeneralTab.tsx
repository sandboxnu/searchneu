"use client";

import { useMemo, useState } from "react";
import { Check, ChevronUp, ChevronDown } from "lucide-react";
import { NotFulfilledIcon } from "@/components/icons/NotFulfilled";
import { Audit } from "@/lib/graduate/types";
import {
  collectFulfilledNupaths,
  NUPATH_DISPLAY,
  NUPATH_CODES,
} from "@/lib/graduate/requirementUtils";
import { CircularProgress } from "./CircularProgress";

// ── NUPath Card ─────────────────────────────────────────────────────────────

function NUPathCard({
  code,
  name,
  fulfilled,
}: {
  code: string;
  name: string;
  fulfilled: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
        fulfilled ? "border-green/30 bg-green/10" : "border-neu2 bg-neu1"
      }`}
    >
      <span
        className={`w-7 text-xs font-bold ${fulfilled ? "text-green" : "text-neu8"}`}
      >
        {code}
      </span>
      <span
        className={`flex-1 text-xs ${fulfilled ? "text-green" : "text-neu6"}`}
      >
        {name}
      </span>
      {fulfilled ? (
        <div className="bg-green flex h-5 w-5 items-center justify-center rounded-full text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </div>
      ) : (
        <NotFulfilledIcon className="h-5 w-5 shrink-0" />
      )}
    </div>
  );
}

// ── Main GeneralTab ─────────────────────────────────────────────────────────

export function GeneralTab({
  schedule,
  creditsTaken,
  creditsTotal,
}: {
  schedule: Audit;
  creditsTaken: number;
  creditsTotal: number;
}) {
  const fulfilledNupaths = useMemo(
    () => collectFulfilledNupaths(schedule),
    [schedule],
  );
  const [nupathOpen, setNupathOpen] = useState(true);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <CircularProgress current={creditsTaken} total={creditsTotal} />
      </div>

      {/* NUPath Section */}
      <div className="select-none">
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={() => setNupathOpen(!nupathOpen)}
        >
          <div className="flex items-center gap-2">
            <span className="text-neu7 text-xs font-bold tracking-wide uppercase">
              NUPath
            </span>
            <span className="text-neu5 text-xs">
              ({fulfilledNupaths.size}/{NUPATH_CODES.length})
            </span>
          </div>
          {nupathOpen ? (
            <ChevronUp className="text-neu5 h-4 w-4 shrink-0" />
          ) : (
            <ChevronDown className="text-neu5 h-4 w-4 shrink-0" />
          )}
        </button>
        {nupathOpen && (
          <div className="mt-2 flex flex-col gap-2">
            {NUPATH_CODES.map((code) => (
              <NUPathCard
                key={code}
                code={code}
                name={NUPATH_DISPLAY[code]}
                fulfilled={fulfilledNupaths.has(code)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
