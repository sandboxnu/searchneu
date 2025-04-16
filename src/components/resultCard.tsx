import { cn } from "@/lib/cn";
import Link from "next/link";

export function ResultCard(props: {
  link: string;
  result: {
    name: string;
    courseNumber: string;
    subject: string;
    minCredits: number;
    maxCredits: number;
  };
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
      data-active={props.active}
      className={cn(
        "bg-background data-[active=true]:bg-muted flex flex-col rounded px-4 py-2.5",
      )}
    >
      <Link href={props.link} className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">
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
