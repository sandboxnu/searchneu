"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { useSearchParamWriter } from "@/lib/catalog/useSearchParamWriter";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { FilterSection } from "./FilterSection";

export function RangeSlider() {
  const searchParams = useSearchParams();
  const { commit } = useSearchParamWriter();

  const [d, setD] = useState([
    Number.parseInt(searchParams.get("nci") ?? "1"),
    Number.parseInt(searchParams.get("xci") ?? "9"),
  ]);

  // debounce the range slider (avoid request every notch)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      commit((params) => {
        if (d[0] === 1 && d[1] === 9) {
          params.delete("nci");
          params.delete("xci");
        } else {
          params.set("nci", String(d[0]));
          params.set("xci", String(d[1]));
        }
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  });

  return (
    <FilterSection label="COURSE ID RANGE" htmlFor="course-id-range">
      <div>
        <Slider
          className=""
          id="course-id-range"
          value={d}
          onValueChange={(value) =>
            setD(Array.isArray(value) ? value : [value])
          }
          min={1}
          max={9}
          step={1}
        />

        <div className="text-neu6 flex w-full justify-between pt-2 text-sm">
          <RangeTicks />
        </div>
        <div className="text-neu6 flex w-full justify-between text-sm">
          <RangeLabels />
        </div>
      </div>
    </FilterSection>
  );
}

function RangeTicks() {
  function GenerateTicks(n: number) {
    return (
      <div key={n * 1000} className="flex w-0.5 flex-col items-center">
        <span
          className={cn(
            "text-neu5 border-l",
            n % 2 === 0 ? "h-3 border-current" : "h-2 border-current",
          )}
        />
      </div>
    );
  }

  return (
    <div className="mx-1.25 flex w-full justify-between px-0.5">
      {Array.from({ length: 9 }, (_, i) => i + 1).map(GenerateTicks)}
    </div>
  );
}

function RangeLabels() {
  function GenerateLabels(n: number) {
    return (
      <div key={n * 1000} className="flex w-0.5 flex-col items-center">
        {n % 2 === 0 ? (
          <span className="text-neu6 text-sm">{n * 1000}</span>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    );
  }

  return (
    <div className="mx-1.25 flex w-full justify-between px-0">
      {Array.from({ length: 9 }, (_, i) => i + 1).map(GenerateLabels)}
    </div>
  );
}
