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
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="MobileSearchResult">
      <div
        className={
          expanded
            ? 'MobileSearchResult__header--expanded'
            : 'MobileSearchResult__header'
        }
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
      >
        <IconCollapseExpand /> {headerLeft} {headerRight}
      </div>
      {expanded && <div className="MobileSearchResult__panel">{body}</div>}
    </div>
  );
}
