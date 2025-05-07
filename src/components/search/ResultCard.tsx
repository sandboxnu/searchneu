import { cn } from "@/lib/cn";
import { convertNupathToCode } from "@/lib/banner/nupaths";
import Link from "next/link";

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
      className="bg-neu1 hover:bg-muted data-[active=true]:bg-muted data-[active=true]:border-border flex flex-col gap-0.5 rounded border-[0.5px] border-transparent px-4 py-2 shadow-xs"
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
          {props.result.sectionsWithSeats}/{props.result.totalSections} sections
          available
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
        <span key={n} className="bg-neu3 rounded px-2 text-xs font-medium">
          {n}
        </span>
      ))}
      {plusMore > 0 && (
        <span className="bg-neu3 rounded px-2 text-xs font-medium">
          +{plusMore}
        </span>
      )}
    </ul>
  );
}
