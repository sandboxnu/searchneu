import { cn } from "@/lib/cn";
import Link from "next/link";
import { Badge } from "../ui/badge";

interface ResultCardData {
  name: string;
  courseNumber: string;
  subject: string;
  minCredits: number;
  maxCredits: number;
  sectionsWithSeats: number;
  totalSections: number;
  nupaths: string[];
}

interface ResultCardProps {
  link: string;
  result: ResultCardData;
  active: boolean;
}

/**
 * ResultCard Component
 * Displays course information in search results
 */
export function ResultCard(props: ResultCardProps) {
  const { link, result, active } = props;

  const creditRange = getCreditRange(result.minCredits, result.maxCredits);
  const creditLabel = creditRange === "1" ? "credit" : "credits";
  const sectionCapacity = result.sectionsWithSeats / result.totalSections;

  return (
    <Link
      href={link}
      data-active={active}
      className="bg-background data-[active=true]:border-primary flex flex-col gap-1 rounded-lg border-1 p-4"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-base leading-tight font-black">
          {result.subject} {result.courseNumber}
        </h1>
        <span className="text-muted-foreground text-sm">
          {creditRange} {creditLabel}
        </span>
      </div>
      
      <p className="text-muted-foreground pb-1 text-sm">{result.name}</p>
      
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-sm font-medium",
            sectionCapacity > 0.3 && "text-status-success",
            sectionCapacity <= 0.3 && sectionCapacity > 0 && "text-status-warning",
            sectionCapacity <= 0 && "text-status-error",
          )}
        >
          {result.sectionsWithSeats}/{result.totalSections} section
          {result.totalSections > 1 && "s"} available
        </span>
        
        <NUPathBadges nupaths={result.nupaths} />
      </div>
    </Link>
  );
}

/**
 * Helper function to format credit range
 */
function getCreditRange(minCredits: number, maxCredits: number): string {
  if (minCredits === maxCredits) {
    return String(minCredits);
  }
  return `${minCredits}-${maxCredits}`;
}

interface NUPathBadgesProps {
  nupaths: string[];
}

/**
 * NUPathBadges Component
 * Displays NUPath requirements as badges
 */
function NUPathBadges(props: NUPathBadgesProps) {
  const { nupaths } = props;
  const displayPaths = nupaths.slice(0, 2);
  const remainingCount = Math.max(0, nupaths.length - 2);

  return (
    <ul className="flex gap-0.5">
      {displayPaths.map((nupath) => (
        <Badge
          key={nupath}
          className="text-neutral-700 rounded border-none px-2 py-1 text-xs leading-tight font-bold"
        >
          {nupath}
        </Badge>
      ))}
      
      {remainingCount > 0 && (
        <Badge className="text-neutral-700 rounded border-none px-2 py-1 text-xs leading-tight font-bold">
          +{remainingCount}
        </Badge>
      )}
      
      {nupaths.length === 0 && (
        <Badge
          variant="secondary"
          className="text-neutral-500 rounded border-none px-2 py-1 text-xs leading-tight font-bold"
        >
          No NUPaths
        </Badge>
      )}
    </ul>
  );
}
