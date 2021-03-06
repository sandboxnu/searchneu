import _ from 'lodash';
import React, { ReactElement } from 'react';
import {
  DEFAULT_FILTER_SELECTION,
  FilterSelection,
  FILTERS_BY_CATEGORY,
} from './filters';

interface PillProps {
  verbose: string; // for desktop
  compact: string; // for mobile
  onClose: () => void;
}

function FilterPill({ verbose, compact, onClose }: PillProps): ReactElement {
  return (
    <div className="FilterPill">
      <button className="FilterPill__close" type="button" onClick={onClose}>
        <span className="FilterPill__verbose">{verbose}</span>
        <span className="FilterPill__compact">{compact}</span>
        <span className="FilterPill__icon" />
      </button>
    </div>
  );
}

interface FilterPillsProps {
  filters: FilterSelection;
  setFilters: (f: FilterSelection) => void;
}

const OPTIONS_FILTERS = {
  ...FILTERS_BY_CATEGORY.Dropdown,
  ...FILTERS_BY_CATEGORY.Checkboxes,
};

export default function FilterPills({
  filters,
  setFilters,
}: FilterPillsProps): ReactElement {
  const crumbs: PillProps[] = [];

  // Add all the selected option filters
  for (const [key, spec] of Object.entries(OPTIONS_FILTERS)) {
    for (const s of filters[key]) {
      crumbs.push({
        verbose: `${spec.display}: ${s}`,
        compact: s,
        onClose: () => setFilters({ [key]: _.without(filters[key], s) }),
      });
    }
  }

  for (const [key, spec] of Object.entries(FILTERS_BY_CATEGORY.Toggle)) {
    if (filters[key]) {
      crumbs.push({
        verbose: spec.display,
        compact: spec.display,
        onClose: () => setFilters({ [key]: false }),
      });
    }
  }

  for (const [key, spec] of Object.entries(FILTERS_BY_CATEGORY.Range)) {
    if (filters[key] && (filters[key].min || filters[key].max)) {
      crumbs.push({
        verbose: `${spec.display}: ${filters[key].min} - ${filters[key].max}`,
        compact: `${filters[key].min} - ${filters[key].max}`,
        onClose: () => setFilters({ [key]: {} }),
      });
    }
  }

  return (
    <div>
      <div className="selected-filters">
        <span className="selected-filters__label">
          Applied ({crumbs.length}):
        </span>
        <div className="selected-filters__row">
          {crumbs.map((crumb: PillProps) => (
            <FilterPill
              key={crumb.verbose}
              verbose={crumb.verbose}
              compact={crumb.compact}
              onClose={crumb.onClose}
            />
          ))}
        </div>
      </div>
      <div
        className="selected-filters__clear"
        role="button"
        tabIndex={0}
        onClick={() => setFilters(DEFAULT_FILTER_SELECTION)}
      >
        Clear All
      </div>
    </div>
  );
}
