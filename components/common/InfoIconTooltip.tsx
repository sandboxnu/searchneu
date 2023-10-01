import React, { ReactElement } from 'react';
import IconInfo from '../icons/info-icon.svg';
import Tooltip, { TooltipProps } from '../Tooltip';

export default function SearchInfoIcon(props: TooltipProps) {
  return (
    <div className="InfoIconTooltip">
      <IconInfo className="InfoIconTooltip__icon" />
      <Tooltip {...props} />
    </div>
  );
}
