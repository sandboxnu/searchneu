import { cn } from "@/lib/cn";
import Link from "next/link";
import { Badge } from "../ui/badge";

export function ResultCard(props: {
  link: string;
  result: {
    name: string;
    courseNumber: string;
    subject: string;
    minCredits: number;
    maxCredits: number;
    sectionsWithSeats: number;
    totalSections: number;
    nupaths: string[];
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

  const sectionCapacity =
    props.result.sectionsWithSeats / props.result.totalSections;

  return (
    <Link
      href={props.link}
      data-active={props.active}
      className="bg-neu1 flex flex-col rounded-lg border-1 data-[active=true]:border-neu3 p-4"
    >
      <div className="flex flex-col gap-1 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-neu8 leading-tight font-bold">
            {props.result.subject + " " + props.result.courseNumber}
          </h1>
          <span className="text-neu6 text-sm">
            {creditRange} {creditLabel}
          </span>
        </div>
        <p className="text-neu6 text-sm">{props.result.name}</p>
      </div>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-sm font-medium",
            sectionCapacity > 0.3 && "text-green",
            sectionCapacity <= 0.3 && "text-yellow",
            sectionCapacity <= 0 && "text-red",
          )}
        >
          {props.result.sectionsWithSeats}/{props.result.totalSections} section
          {props.result.totalSections > 1 && "s"} available
        </span>
        <NUPathBadges nupaths={props.result.nupaths} />
      </div>
    </Link>
  );
}

function NUPathBadges(props: { nupaths: string[] }) {
  let plusMore = 0;
  let paths = props.nupaths;

  if (paths.length > 3) {
    plusMore = paths.length - 2;
    paths = paths.slice(0, 2);
  }

  return (
    <ul style={{gap: "0.3125rem"}} className="flex">
      {paths.map((n) => (
        <Badge
          key={n}
          style={{lineHeight : 1.2}}
          className="text-neu7 rounded border-none px-2 py-1 text-xs leading-tight font-bold"
        >
          {n}
        </Badge>
      ))}
      {plusMore > 0 && (
        <Badge style={{lineHeight : 1.2}} 
        className="text-neu7 rounded border-none px-2 py-1 text-xs leading-tight font-bold">
          +{plusMore}
        </Badge>
      )}
      {/* NOTE: is the empty badge good? */}
      {paths.length === 0 && (
        <Badge
          variant="secondary"
          style={{lineHeight : 1.2}}
          className="text-neu5 rounded border-none px-2 py-1 text-xs leading-tight font-bold"
        >
          No NUPaths
        </Badge>
      )}
    </ul>
  );
}
