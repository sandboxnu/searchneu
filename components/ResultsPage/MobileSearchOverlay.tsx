import React, { ReactElement, useEffect, useState } from 'react';
import IconClose from '../icons/IconClose';
import macros from '../macros';
import FilterPanel from './FilterPanel';
import FilterPills from './FilterPills';
import { areFiltersSet, FilterOptions, FilterSelection } from './filters';

/**
 * setFilterPills sets the selected filters
 * onExecute indicates the query should be run and we should return to the results page
 * onClose indicates the user wants to close the overlay and return to wherever we were before
 * filterSelection is the list of selected filters
 * filterOptions is the available options for the filters
 * query is the search query
 */
interface MobileSearchOverlayProps {
  setFilterPills: (f: FilterSelection) => void;
  onExecute: () => void;
  filterSelection: FilterSelection;
  filterOptions: FilterOptions;
}

export default function MobileSearchOverlay({
  setFilterPills,
  filterSelection,
  filterOptions,
  onExecute,
}: MobileSearchOverlayProps): ReactElement {
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
    onExecute();
  };
  return (
    <div className="msearch-overlay">
      <div className="msearch-overlay__content">
        <div className="msearch-overlay__pills">
          {areFiltersSet(filterSelection) && (
            <FilterPills
              filters={filterSelection}
              setFilters={setFilterPills}
            />
          )}
        </div>
        <div
          className="msearch-overlay__back"
          role="button"
          tabIndex={0}
          onClick={search}
        >
          <IconClose fill="#d41b2c" />
        </div>
        <FilterPanel
          options={filterOptions}
          selected={filterSelection}
          setActive={setFilterPills}
        />
      </div>
      <div
        tabIndex={0}
        className="msearch-overlay__execute"
        onClick={search}
        role="button"
      >
        View all results
      </div>
    </div>
  );
}
