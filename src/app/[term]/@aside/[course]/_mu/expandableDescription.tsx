"use client";

import { useState } from "react";

export function ExpandableDescription(props: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Define the character limit for the collapsed view
  const charLimit = 300;

  // Check if the description exceeds the character limit
  const needsExpansion = props.description.length > charLimit;

  // Get the display text based on expansion state
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
          className="text-blue-600 hover:text-blue-800 text-sm mt-2 focus:outline-none"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </>
  );
}
