/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import React, { ReactElement, useEffect, useState } from 'react';
import MagnifyingGlass from '../icons/magnifying-glass.svg';
import macros from '../macros';
import SearchInfoIcon from '../common/SearchInfoIcon';
interface SearchBarProps {
  query: string;
  onSearch: (q: string) => void;
  onClick?: () => void;
  buttonColor: string;
}

/**
 * Component to handle the searchbar input. Abstracts the jankiness of controlling input components.
 */
export default function SearchBar({
  query,
  onSearch,
  onClick,
  buttonColor,
}: SearchBarProps): ReactElement {
  // controlledQuery represents what's typed into the searchbar - even BEFORE enter is hit
  const [controlledQuery, setControlledQuery] = useState(query);

  // Keep the controlledQuery in sync with the query prop (eg. browser popState)
  useEffect(() => {
    setControlledQuery(query);
  }, [query]);

  // Hide keyboard and execute search
  const search = (): void => {
    if (macros.isMobile) {
      if (
        document.activeElement &&
        document.activeElement instanceof HTMLElement
      ) {
        document.activeElement.blur();
      }
    }
    onSearch(controlledQuery);
  };

  return (
    <>
      <div className="searchbar">
        <input
          type="search"
          id="search_id"
          autoComplete="off"
          spellCheck="false"
          // TODO: ahhh what is this lmao // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={!macros.isMobile}
          tabIndex={0}
          className="searchbar__input"
          size={10}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              search();
            }
          }}
          onClick={onClick}
          onChange={(event) => {
            setControlledQuery(event.target.value);
          }}
          value={controlledQuery}
          placeholder={
            !macros.isMobile
              ? 'Class, professor, course number, "phrase"'
              : undefined
          }
        />
        <div
          onClick={search}
          className={`searchbar__button`}
          role="button"
          tabIndex={0}
          style={{ background: buttonColor }}
        >
          <MagnifyingGlass
            aria-label="magnifying glass"
            className="searchbar__magnifyingGlass"
          />
        </div>
      </div>
      {!macros.isMobile ? <SearchInfoIcon /> : <></>}
    </>
  );
}
