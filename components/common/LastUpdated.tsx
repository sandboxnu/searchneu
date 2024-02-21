import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { ReactElement } from 'react';
import Tooltip, { TooltipDirection } from '../Tooltip';
import IconGlobe from '../icons/IconGlobe';

dayjs.extend(relativeTime);

interface LastUpdatedProps {
  lastUpdateTime: number;
  iconHeight?: string;
  iconWidth?: string;
  className?: string;
}

export function getLastUpdateString(lastUpdateTime: number): string {
  return lastUpdateTime ? dayjs(lastUpdateTime).fromNow() : null;
}

export function LastUpdated({
  lastUpdateTime,
  iconHeight,
  iconWidth,
  className,
}: LastUpdatedProps): ReactElement {
  return (
    <div className={className ? className : ''}>
      <IconGlobe height={iconHeight} width={iconWidth} />
      <Tooltip
        text={'View this course on Banner.'}
        direction={TooltipDirection.Down}
      />
      <span className="updatedText">{`Updated ${getLastUpdateString(
        lastUpdateTime
      )}`}</span>
    </div>
  );
}

export function LastUpdatedMobile({
  lastUpdateTime,
}: LastUpdatedProps): ReactElement {
  return <>Updated {getLastUpdateString(lastUpdateTime)}</>;
}
