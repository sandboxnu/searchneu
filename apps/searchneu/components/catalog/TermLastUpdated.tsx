"use client";

import { Globe, GlobeLock } from "lucide-react";

export function TermLastUpdated({
  updatedAt,
  isTermActive,
}: {
  updatedAt: Date;
  isTermActive: boolean;
}) {
  return (
    <span className="text-neu6 flex max-w-20 items-center gap-1 sm:max-w-full">
      {isTermActive ? (
        <>
          <Globe className="size-4" />
          <h2
            style={{ lineHeight: 1.3 }}
            className="text-neu6 text-xs italic md:text-sm"
          >
            {formatLastUpdatedString(updatedAt)}
          </h2>
        </>
      ) : (
        <>
          <GlobeLock className="size-4" />
          <h2
            style={{ lineHeight: 1.3 }}
            className="text-neu6 text-xs italic md:text-sm"
          >
            {"Last updated " + updatedAt.toLocaleDateString()}
          </h2>
        </>
      )}
    </span>
  );
}

function formatLastUpdatedString(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let str = "Updated ";

  if (seconds < 0) {
    str += "in the future???";
    return str;
  }

  if (seconds < 60) {
    str += "less than a minute ago";
    return str;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    str += minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    return str;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    str += hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    return str;
  }

  const days = Math.floor(hours / 24);
  str += days === 1 ? "1 day ago" : `${days} days ago`;
  return str;
}
