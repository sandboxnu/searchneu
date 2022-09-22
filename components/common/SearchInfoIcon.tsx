import React, { ReactElement } from 'react';
import IconInfo from '../icons/info-icon.svg';
import Tooltip, { TooltipDirection } from '../Tooltip';

const TOOLTIP_MESSAGE =
  'Phrase search guarantees the exact search appears in the results. Ex. If you want the exact phrase "studio design" to appear in the search results, wrap it up in quotes.';
export default function SearchInfoIcon() {
  return (
    <div className="SearchInfoIcon">
      <IconInfo className="SearchInfoIcon__icon" />
      <Tooltip text={TOOLTIP_MESSAGE} direction={TooltipDirection.Down} />
    </div>
  );
}
