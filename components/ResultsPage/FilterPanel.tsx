import _ from 'lodash';
import React, { ReactElement } from 'react';
import CheckboxFilter from './CheckboxFilter';
import DropdownFilter from './DropdownFilter';
import { FilterOptions, FilterSelection, FILTERS_IN_ORDER } from './filters';
import RangeFilter from './RangeFilter';
import type { Option } from './filters';

export interface FilterPanelProps {
  options: FilterOptions;
  selected: FilterSelection;
  setActive: (f: FilterSelection) => void;
}

function FilterPanel({
  options,
  selected,
  setActive,
}: FilterPanelProps): ReactElement {
  return (
    <div className="FilterPanel">
      {FILTERS_IN_ORDER.map(({ key, display, category }, index) => {
        const aFilter = selected[key];
        const setActiveFilter = (a): void => setActive({ [key]: a });
        console.log(
          `OPTIONS[${JSON.stringify(key)}]: ${JSON.stringify(options[key])}`
        );
        return (
          <React.Fragment key={index}>
            {category === 'Dropdown' && (
              <DropdownFilter
                title={display}
                options={options[key]}
                selected={aFilter}
                setActive={setActiveFilter}
              />
            )}
            {category === 'Checkboxes' && (
              <CheckboxFilter
                title={display}
                options={formatHonorsOptionValues(display, options[key])}
                selected={aFilter}
                setActive={setActiveFilter}
              />
            )}
            {category === 'Range' && (
              <RangeFilter
                title={display}
                selected={aFilter}
                setActive={setActiveFilter}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Formats the option text values if the options are for the honors filter. Only displays the Honors Sections option if availible,
// and only displays Non-Honors Sections if there are no Honors
function formatHonorsOptionValues(
  display: String,
  honorsOptions: Option[]
): Option[] {
  if (display === 'Honors' && honorsOptions.length != 0) {
    honorsOptions[0].value = 'Non-Honors Sections';
    if (honorsOptions.length == 2) {
      honorsOptions[1].value = 'Honors Sections';
      return [honorsOptions[1]];
    }
  }
  return honorsOptions;
}

export default React.memo(FilterPanel, _.isEqual);
