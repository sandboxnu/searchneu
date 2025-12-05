"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, use, Suspense, ComponentProps } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/cn";

export function RangeSlider() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [d, setD] = useState([
    Number.parseInt(searchParams.get("nci") ?? "1"),
    Number.parseInt(searchParams.get("xci") ?? "9"),
  ]);

  // debounce the range slider (avoid request every notch)
  useEffect(() => {
    function updateSearchParams(range: number[]) {
      const params = new URLSearchParams(searchParams);
      if (range[0] === 1 && range[1] === 9) {
        params.delete("nci");
        params.delete("xci");
        window.history.pushState(null, "", `${pathname}?${params.toString()}`);
        return;
      }

      params.set("nci", String(range[0]));
      params.set("xci", String(range[1]));
      window.history.pushState(null, "", `${pathname}?${params.toString()}`);
    }

    const timeoutId = setTimeout(() => {
      updateSearchParams(d);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [d]);

  return (
    <>
      <Slider
        className="**:data-[slot=slider-thumb]:bg-accent **:data-[slot=slider-range]:bg-accent"
        id="course-id-range"
        value={d}
        onValueChange={setD}
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
    </>
  );
}

function RangeTicks() {
  function GenerateTicks(n: number) {
    return (
      <div key={n * 1000} className="flex w-[2px] flex-col items-center">
        <span
          className={cn(
            "text-muted-foreground border-l",
            n % 2 === 0 ? "h-3 border-current" : "h-2 border-current",
          )}
        />
      </div>
    );
  }

  return (
    <div className="mx-[5px] flex w-full justify-between px-0.5">
      {Array.from({ length: 9 }, (_, i) => i + 1).map(GenerateTicks)}
    </div>
  );
}

function RangeLabels() {
  function GenerateLabels(n: number) {
    return (
      <div key={n * 1000} className="flex w-[2px] flex-col items-center">
        {n % 2 === 0 ? (
          <span className="text-muted-foreground text-sm">{n * 1000}</span>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    );
  }

  return (
    <div className="mx-[5px] flex w-full justify-between px-0">
      {Array.from({ length: 9 }, (_, i) => i + 1).map(GenerateLabels)}
    </div>
  );
}
