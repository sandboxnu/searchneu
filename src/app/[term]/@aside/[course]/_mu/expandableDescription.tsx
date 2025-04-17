"use client";

import { useState } from "react";

// yes this is ai code yes it is bad but it was fast alright?
export function ExpandableDescription(props: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // define the character limit for the collapsed view
  const charLimit = 300;

  // check if the description exceeds the character limit
  const needsExpansion = props.description.length > charLimit;

  // get the display text based on expansion state
  const displayText =
    isExpanded || !needsExpansion
      ? props.description
      : `${props.description.substring(0, charLimit)}...`;

  return (
    <>
      <p>{displayText}</p>

      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </>
  );
}
