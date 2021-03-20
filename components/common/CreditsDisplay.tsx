import React, { ReactElement } from 'react';

interface CreditsDisplayProps {
  maxCredits: number;
  minCredits: number;
}

const creditsString = (maxCredits: number, minCredits: number) => {
  const creditDescriptor =
    maxCredits > 1 || maxCredits === 0 ? 'CREDITS' : 'CREDIT';
  return maxCredits === minCredits
    ? `${maxCredits} ${creditDescriptor}`
    : `${minCredits}-${maxCredits} ${creditDescriptor}`;
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
