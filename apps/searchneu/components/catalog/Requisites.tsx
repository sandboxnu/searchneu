"use client";

import Link from "next/link";
import { Fragment, useState, useEffect, useRef } from "react";
import type {
  Requisite,
  Condition,
  Course,
  Test,
  RequisiteItem,
} from "@/scraper/reqs";
import { cn } from "@/lib/cn";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";

// Type guards
const isCondition = (item: RequisiteItem): item is Condition => {
  return "type" in item && "items" in item;
};

const isCourse = (item: RequisiteItem): item is Course => {
  return "subject" in item && "courseNumber" in item;
};

const isTest = (item: RequisiteItem): item is Test => {
  return "name" in item && "score" in item;
};

const isEmpty = (requisite: Requisite): requisite is Record<string, never> => {
  return Object.keys(requisite).length === 0;
};

export function RequisiteBlock({
  req,
  termId,
  prereqMode,
}: {
  req: Requisite;
  termId: string;
  prereqMode: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const [isAnimating, setIsAnimating] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (contentRef && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  const handleToggle = () => {
    setIsAnimating(true);
    setExpanded(!expanded);
    setTimeout(() => setIsAnimating(false), 500); // Match duration-500
  };

  if (isEmpty(req)) {
    return <p className="text-neu5 text-sm italic">None</p>;
  }

  const tree = RequisiteItemComponent({
    item: req,
    term: termId,
    depth: 0,
    prereqMode: prereqMode,
    searchParam: searchParams.toString(),
  });

  return (
    <>
      <div
        ref={contentRef}
        className={cn("", {
          "transition-all duration-500 ease-in-out":
            isCondition(req) && contentHeight > 120,
          "overflow-hidden": isAnimating || !expanded,
          "overflow-visible": !isAnimating && expanded,
        })}
        style={{
          maxHeight:
            isCondition(req) && !expanded ? "120px" : `${contentHeight}px`,
        }}
      >
        {tree}
      </div>
      {contentHeight > 120 && isCondition(req) && (
        <Button
          className={cn(
            "text-neu6 hover:bg-neu3/30 hover:text-neu6 mt-2 -mb-2 h-6 py-1.5 text-[10px] font-bold",
          )}
          variant="ghost"
          onClick={handleToggle}
        >
          {expanded ? <>COLLAPSE</> : <>SEE ALL ({req.items.length})</>}
          <ChevronDown
            className={cn("transform transition duration-200", {
              "rotate-180": expanded,
            })}
          />
        </Button>
      )}
    </>
  );
}

function RequisiteItemComponent({
  item,
  term,
  depth,
  prereqMode,
  searchParam,
}: {
  item: RequisiteItem;
  term: string;
  depth: number;
  prereqMode: boolean;
  searchParam: string | null;
}) {
  if (isCondition(item)) {
    return (
      <div
        className={cn("space-y-1", {
          "border-neu3 border-l-2 pl-1": depth > 0,
        })}
      >
        {depth > 0 && item.type === "or" && (
          <div className="text-neu6 py-1 text-xs font-semibold">
            one of the following ({item.items.length})
          </div>
        )}
        {item.items.map((subItem, index) => (
          <Fragment key={index}>
            <RequisiteItemComponent
              item={subItem}
              term={term}
              depth={depth + 1}
              prereqMode={true}
              searchParam={searchParam}
            />
            {depth > 0 &&
              item.type === "and" &&
              index < item.items.length - 1 && (
                <div className="text-neu6 py-1 text-xs font-semibold uppercase">
                  {item.type}
                </div>
              )}
            {prereqMode && depth === 0 && index < item.items.length - 1 && (
              <div className="text-neu6 py-1 text-xs font-semibold uppercase">
                {item.type}
              </div>
            )}
          </Fragment>
        ))}
      </div>
    );
  }

  if (isCourse(item)) {
    return (
      <Link
        href={`/catalog/${term}/${item.subject}%20${item.courseNumber}${searchParam ?? ""}`}
        className="bg-neu1 flex items-center rounded-lg border p-2.5"
      >
        <span className="text-neu8 text-xs font-bold whitespace-nowrap">
          {item.subject} {item.courseNumber}
        </span>
        {/* {item.name && ( */}
        {/*   <span className="text-expanded-system-neu6 truncate text-xs"> */}
        {/*     {item.name} */}
        {/*   </span> */}
        {/* )} */}
      </Link>
    );
  }

  if (isTest(item)) {
    return (
      <div className="bg-neu1 flex items-center rounded-lg border p-2.5">
        <span className="text-neu8 text-xs font-bold whitespace-nowrap">
          {item.name}
        </span>
      </div>
    );
  }

  return null;
}
