import React, { ReactElement, useState } from 'react';
import IconCollapseExpand from '../../icons/IconCollapseExpand';

interface SearchResultProps {
  headerLeft: ReactElement;
  headerRight?: ReactElement;
  body: ReactElement;
  afterBody?: ReactElement;
}

export function SearchResult({
  headerLeft,
  headerRight,
  body,
  afterBody,
}: SearchResultProps): ReactElement {
  return (
    <div className="SearchResult">
      <div className="SearchResult__header">
        <div className="SearchResult__header--left">{headerLeft}</div>
        {headerRight}
      </div>
      <div className="SearchResult__panel">{body}</div>
      {afterBody}
    </div>
  );
}

export function MobileSearchResult({
  headerLeft,
  headerRight,
  body,
  afterBody,
}: SearchResultProps): ReactElement {
  return (
    <div className="MobileSearchResult">
      <div className="MobileSearchResult__header">
        {headerLeft} {headerRight}
      </div>
    </div>
  );
}
