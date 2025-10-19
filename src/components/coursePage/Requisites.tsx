"use client";

import { useState } from "react";
import Link from "next/link";
import { ReqBoxItem } from "./ReqsWrapper";

export function Requisites({
  title,
  items,
  termId,
}: {
  title: string;
  items: ReqBoxItem[];
  termId: string;
}) {
  const [showAll, setShowAll] = useState(false);

  const limit = 4;
  const total = items.filter((item) => item.type !== "separator").length;

  const getItemsUpToLimit = (items: ReqBoxItem[]) => {
    let itemCount = 0;
    const reducedItems = [];
    for (const item of items) {
      if (item.type !== "separator") {
        itemCount++;
      }
      reducedItems.push(item);
      if (itemCount >= limit) {
        break;
      }
    }
    return reducedItems;
  };

  const renderItem = (item: ReqBoxItem, i: number, keyPrefix: string = "") => {
    if (item.type === "separator") {
      return (
        <div
          key={`sep-${keyPrefix}-${i}`}
          className="flex w-full flex-col gap-1.5"
        >
          <DashedLine />
          <div className="font-xs text-neu6 text-center text-xs">
            {i > 1 && "and"} (1) of the following:
          </div>
        </div>
      );
    }

    if (item.type === "course") {
      return (
        <Link
          key={`${item.subject}-${item.courseNumber}-${keyPrefix}-${i}`}
          href={`/catalog/${termId}/${item.subject}%20${item.courseNumber}`}
          className="outline-border rounded-lg bg-white p-2.5 text-left outline-1 transition-colors hover:bg-gray-200"
        >
          <div className="flex items-center gap-2">
            <span className="text-expanded-system-neu8 text-xs font-bold whitespace-nowrap">
              {item.subject} {item.courseNumber}
            </span>
            {item.name && (
              <span className="text-expanded-system-neu6 truncate text-xs">
                {item.name}
              </span>
            )}
          </div>
        </Link>
      );
    }

    if (item.type === "test") {
      return (
        <div
          key={`${item.name}-${keyPrefix}-${i}`}
          className="rounded-lg bg-white px-4 py-3 text-gray-700"
        >
          {item.name} {item.score}
        </div>
      );
    }

    return null;
  };

  const limitedItems = getItemsUpToLimit(items);
  const hiddenItems = items.slice(limitedItems.length);

  return (
    <div className="bg-utility-colors-off-white flex flex-1 flex-col rounded-lg p-4 pb-2">
      <h3 className="text-neu7 mb-2 text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      <div className="flex flex-col gap-2">
        {limitedItems.length == 0 && (
          <p className="text-expanded-system-neu5 text-xs italic"> None </p>
        )}
        {limitedItems.map((item, i) => renderItem(item, i, "limited"))}

        <div
          className={`grid transition-all duration-500 ease-in-out ${
            showAll ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-2">
              {hiddenItems.map((item, i) => renderItem(item, i, "hidden"))}
            </div>
          </div>
        </div>
      </div>
      {total > limit && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-neu6 flex w-full items-center justify-center gap-1 px-3 py-1.5 pb-[-4px] text-sm font-bold tracking-wide uppercase transition-colors hover:bg-gray-50"
        >
          <span>{showAll ? "Collapse" : "Expand"}</span>
          <svg
            width="8"
            height="5"
            viewBox="0 0 8 5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.07209 4.45978C6.93625 4.59559 6.75203 4.67188 6.55995 4.67188C6.36787 4.67188 6.18365 4.59559 6.04781 4.45978L3.66241 2.07439L1.27701 4.45978C1.14039 4.59174 0.957411 4.66475 0.767479 4.6631C0.577548 4.66145 0.395863 4.58527 0.261556 4.45096C0.127249 4.31665 0.0510659 4.13497 0.0494156 3.94504C0.0477653 3.75511 0.12078 3.57213 0.252732 3.4355L3.15027 0.537966C3.28611 0.402164 3.47033 0.325876 3.66241 0.325876C3.85449 0.325876 4.03871 0.402164 4.17455 0.537966L7.07209 3.4355C7.20789 3.57135 7.28418 3.75556 7.28418 3.94765C7.28418 4.13973 7.20789 4.32394 7.07209 4.45978Z"
              fill="#A3A3A3"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

function DashedLine() {
  return (
    <svg
      width="100%"
      height="1"
      viewBox="0 0 176 1"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <line
        x1="0.5"
        y1="0.5"
        x2="174.833"
        y2="0.5"
        stroke="#C2C2C2"
        strokeLinecap="round"
        strokeDasharray="1 4"
      />
    </svg>
  );
}
