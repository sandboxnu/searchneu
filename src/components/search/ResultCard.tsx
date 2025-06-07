import { cn } from "@/lib/cn";
import { convertNupathToCode } from "@/scraper/nupaths";
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
      className="bg-neu1 hover:bg-neu3/30 data-[active=true]:bg-neu3/30 data-[active=true]:border-neu3 flex flex-col gap-0.5 rounded-lg border-[0.5px] border-transparent px-4 py-2"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          {props.result.subject + " " + props.result.courseNumber}
        </h1>
        <span className="text-neu6 text-sm">
          {creditRange} {creditLabel}
        </span>
      </div>
      <p className="text-neu6 -mt-1 pb-1 text-sm">{props.result.name}</p>
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
  let paths = props.nupaths.map((p) => convertNupathToCode(p.trim()));
  let plusMore = 0;

  if (paths.length > 3) {
    plusMore = paths.length - 2;
    paths = paths.slice(0, 2);
  }

  return (
    <ul className="flex gap-0.5">
      {paths.map((n) => (
        <Badge key={n} className="px-2 py-0 text-xs font-bold">
          {n}
        </Badge>
      ))}
      {plusMore > 0 && (
        <Badge className="px-2 py-0 text-xs font-bold">+{plusMore}</Badge>
      )}
      {/* NOTE: is the empty badge good? */}
      {paths.length === 0 && (
        <Badge
          variant="secondary"
          className="text-neu6 px-2 py-0 text-xs font-bold"
        >
          No NUPaths
        </Badge>
      )}
    </ul>
  );
}
