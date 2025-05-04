"use client";

import { useState } from "react";

// yes this is ai code yes it is bad but it was fast alright?
export function ExpandableDescription(props: { description: string }) {
  const charLimit = 300;
  const needsExpansion = props.description.length > charLimit;

  const [isExpanded, setIsExpanded] = useState(false);

  const displayText =
    isExpanded || !needsExpansion
      ? props.description
      : `${props.description.substring(0, charLimit)}...`;

  return (
    <p>
      {displayText}{" "}
      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-b2 hover:text-b2/80 focus:outline-none"
        >
          {isExpanded ? "show less" : "show more"}
        </button>
      )}
    </p>
  );
}
