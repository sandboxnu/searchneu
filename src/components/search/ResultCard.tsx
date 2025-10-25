import { cn } from "@/lib/cn";
import { Badge } from "../ui/badge";

export function ResultCard(props: {
  result: {
    name: string;
    courseNumber: string;
    subject: string;
    minCredits: string;
    maxCredits: string;
    sectionsWithSeats: number;
    totalSections: number;
    nupaths: string[];
  };
  className?: string;
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
    <>
      <div className="flex items-center justify-between pb-1">
        <h1 className="text-base leading-tight font-black">
          {props.result.subject + " " + props.result.courseNumber}
        </h1>
        <span className="text-neu6 text-sm">
          {creditRange} {creditLabel}
        </span>
      </div>
      <p className="text-neu6 pb-1 text-sm">{props.result.name}</p>
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
    </>
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
    <ul className="flex gap-0.5">
      {paths.map((n) => (
        <Badge
          key={n}
          className="text-neu7 bg-neu25 rounded border-none px-2 py-0.5 text-xs leading-tight font-bold"
        >
          {n}
        </Badge>
      ))}
      {plusMore > 0 && (
        <Badge className="text-neu7 bg-neu25 rounded border-none px-2 py-0.5 text-xs leading-tight font-bold">
          +{plusMore}
        </Badge>
      )}
      {paths.length === 0 && (
        <Badge
          variant="secondary"
          className="text-neu5 rounded border-none px-2 py-1 text-xs leading-tight font-bold"
        >
          No NUPaths
        </Badge>
      )}
    </ul>
  );
}
