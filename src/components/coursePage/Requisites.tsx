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
          className="flex w-full flex-col gap-2"
        >
          {i > 1 && <DashedLine />}
          <div className="font-xs text-center text-xs text-gray-600">
            {i > 1 && "and"} 1 of the following:
          </div>
        </div>
      );
    }

    if (item.type === "course") {
      return (
        <Link
          key={`${item.subject}-${item.courseNumber}-${keyPrefix}-${i}`}
          href={`/catalog/${termId}/${item.subject}%20${item.courseNumber}`}
          className="rounded-lg bg-white p-2.5 text-left outline-1 outline-[#F1F2F2] transition-colors hover:bg-gray-200"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold whitespace-nowrap text-gray-900">
              {item.subject} {item.courseNumber}
            </span>
            {item.name && (
              <span className="truncate text-xs text-gray-600">
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
    <div className="flex flex-1 flex-col gap-1 rounded-lg bg-[#F8F9F9] p-4">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-[#5F5F5F] uppercase">
        {title}
      </h3>
      <div className="flex flex-col gap-2">
        {limitedItems.length == 0 && (
          <p className="text-xs text-[#A3A3A3] italic"> None </p>
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
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium tracking-wide text-gray-600 uppercase transition-colors hover:bg-gray-50"
        >
          <span>{showAll ? "Collapse" : "Expand"}</span>
          <svg
            className={`h-4 w-4 transition-transform duration-500 ${showAll ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
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
