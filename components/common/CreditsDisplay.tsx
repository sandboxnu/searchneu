import React, { ReactElement } from 'react';

interface CreditsDisplayProps {
  maxCredits: number;
  minCredits: number;
}

export function creditsDescription(maxCredits: number): string {
  return maxCredits > 1 || maxCredits === 0 ? 'CREDITS' : 'CREDIT';
}

export function creditsNumericDisplay(
  maxCredits: number,
  minCredits: number
): string {
  return maxCredits === minCredits
    ? `${maxCredits}`
    : `${minCredits}-${maxCredits}`;
}

export const creditsString = (maxCredits: number, minCredits: number) => {
  return `${creditsNumericDisplay(maxCredits, minCredits)} ${creditsDescription(
    maxCredits
  )}`;
};

export function CreditsDisplay({
  maxCredits,
  minCredits,
}: CreditsDisplayProps): ReactElement {
  return (
    <span className="SearchResult__header--creditString">
      {creditsString(maxCredits, minCredits)}
    </span>
  );
}

export function CreditsDisplayMobile({
  maxCredits,
  minCredits,
}: CreditsDisplayProps): ReactElement {
  return <span>{creditsString(maxCredits, minCredits)}</span>;
}
