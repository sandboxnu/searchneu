"use client";

import { Neu } from "../icons/Neu";
import { useEffect, useState } from "react";

export function NeuSearchskiePattern({ count }: { count: number }) {
  const [cols, setCols] = useState(10);
  const spacing = 130;

  useEffect(() => {
    const updateCols = () => {
      const newCols = Math.floor(window.innerWidth / spacing);
      setCols(newCols);
    };

    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  return (
    <div className="bg-neu2 pointer-events-none absolute inset-0 -z-1 overflow-hidden">
      <div
        className="absolute grid"
        style={{
          backgroundImage: "none",
          maskImage: "none",
          WebkitMaskImage: "none",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, 130px)",
          gridAutoRows: "130px",
          left: "-130px",
          right: "-130px",
          top: "0",
          bottom: "0",
          justifyContent: "center",
          alignContent: "center",
        }}
      >
        {Array.from({ length: count }, (_, index) => {
          const row = Math.floor(index / (cols + 2));

          // each row shifts by 1/3 of spacing
          const staggerX = (row % 3) * (spacing / 3);

          return (
            <Neu
              key={index}
              className="mx-auto size-[120px] object-contain opacity-30"
              style={{
                transform: `translateX(${staggerX}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
