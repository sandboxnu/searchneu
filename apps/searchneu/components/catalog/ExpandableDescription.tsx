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
    <p style={{ lineHeight: 1.3 }} className="text-neu8 self-stretch text-base">
      {displayText}{" "}
      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ lineHeight: 1.13 }}
          className="text-blue hover:text-blue/80 text-sm focus:outline-none"
        >
          {isExpanded ? "see less" : "see more"}
        </button>
      )}
    </p>
  );
}
