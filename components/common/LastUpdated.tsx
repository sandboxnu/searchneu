import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { ReactElement, useMemo, useState } from 'react';
import IconGlobe from '../icons/IconGlobe';

dayjs.extend(relativeTime);

interface LastUpdatedProps {
  host: string;
  prettyUrl: string;
  lastUpdateTime: number;
}

export function LastUpdated({
  host,
  prettyUrl,
  lastUpdateTime,
}: LastUpdatedProps): ReactElement {
  const getLastUpdateString = (lastUpdateTime: number): string => {
    return lastUpdateTime ? dayjs(lastUpdateTime).fromNow() : null;
  };
  console.log(prettyUrl);

  return (
    <div className="SearchResult__header--sub">
      <a
        target="_blank"
        rel="noopener noreferrer"
        data-tip={`View on ${host}`}
        href={prettyUrl}
      >
        <IconGlobe />
      </a>
      <span>{`Updated ${getLastUpdateString(lastUpdateTime)}`}</span>
    </div>
  );
}

export function LastUpdatedMobile({
  prettyUrl,
  lastUpdateTime,
}: LastUpdatedProps): ReactElement {
  const getLastUpdateString = (lastUpdateTime: number): string => {
    return lastUpdateTime ? dayjs(lastUpdateTime).fromNow() : null;
  };

  return (
    <a
      href={prettyUrl}
      target="_blank"
      rel="noopener noreferrer"
    >{`Updated ${getLastUpdateString(lastUpdateTime)}`}</a>
  );
}
