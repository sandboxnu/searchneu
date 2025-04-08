import { cn } from "@/lib/cn";
import Link from "next/link";

export function ResultCard(props: {
  result: {
    name: string;
    courseNumber: string;
    subject: string;
    minCredits: number;
    maxCredits: number;
  };
  params: string;
  active: boolean;
}) {
  let creditRange = "";
  if (props.result.minCredits === props.result.maxCredits) {
    creditRange = String(props.result.minCredits);
  } else {
    creditRange = props.result.minCredits + "-" + props.result.maxCredits;
  }

  let creditLabel = "credits";
  if (creditRange === "1") {
    creditLabel = "credit";
  }

  return (
    <li
      className={cn(
        "flex flex-col px-4 py-2.5 rounded border-[0.5px]",
        props.active ? "bg-secondary" : "",
      )}
    >
      <Link
        href={
          "/202530/" +
          props.result.subject +
          " " +
          props.result.courseNumber +
          "?" +
          props.params
        }
        className="flex flex-col gap-1"
      >
        <h1 className="font-semibold text-lg">
          {props.result.subject + " " + props.result.courseNumber}
        </h1>
        <p className="text-sm">{props.result.name}</p>
        <div className="flex justify-between text-sm">
          <span>
            {creditRange} {creditLabel}
          </span>
          <span>40% enrolled</span>
        </div>
        {/* <p className="text-neutral-500">{result.score}</p> */}
      </Link>
    </li>
  );
}
