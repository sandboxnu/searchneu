"use client";

import { useState } from "react";

// yes this is ai code yes it is bad but it was fast alright?
export function ExpandableDescription({
  description,
}: {
  description: string;
}) {
  const charLimit = 200;
  const needsExpansion = description.length > charLimit;

  const [isExpanded, setIsExpanded] = useState(false);

  const displayText =
    isExpanded || !needsExpansion
      ? description
      : `${description.substring(0, charLimit)}...`;

  return (
    <p>
      {displayText}{" "}
      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue hover:text-blue/80 focus:outline-none"
        >
          {isExpanded ? "see less" : "see more"}
        </button>
      )}
    </p>
  );
}
