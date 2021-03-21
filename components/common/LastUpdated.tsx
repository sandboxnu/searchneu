import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { ReactElement } from 'react';
import IconGlobe from '../icons/IconGlobe';

dayjs.extend(relativeTime);

interface LastUpdatedProps {
  host: string;
  prettyUrl: string;
  lastUpdateTime: number;
  iconHeight?: string;
  iconWidth?: string;
  className?: string;
}

export function getLastUpdateString(lastUpdateTime: number): string {
  return lastUpdateTime ? dayjs(lastUpdateTime).fromNow() : null;
}

export function LastUpdated({
  host,
  prettyUrl,
  lastUpdateTime,
  iconHeight,
  iconWidth,
  className,
}: LastUpdatedProps): ReactElement {
  return (
    <div className={className ? className : ''}>
      <a
        target="_blank"
        rel="noopener noreferrer"
        data-tip={`View on ${host}`}
        href={prettyUrl}
        className="bannerPageLink"
      >
        <IconGlobe height={iconHeight} width={iconWidth} />
      </a>
      <span className="updatedText">{`Updated ${getLastUpdateString(
        lastUpdateTime
      )}`}</span>
    </div>
  );
}

export function LastUpdatedMobile({
  prettyUrl,
  lastUpdateTime,
}: LastUpdatedProps): ReactElement {
  return (
    <a
      href={prettyUrl}
      target="_blank"
      rel="noopener noreferrer"
    >{`Updated ${getLastUpdateString(lastUpdateTime)}`}</a>
  );
}
