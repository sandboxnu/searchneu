import { pull, without } from 'lodash';
import React, { ReactElement, useRef, useState } from 'react';
import DropdownArrow from '../icons/DropdownArrow.svg';
import PillClose from '../icons/pillClose.svg';
import { Option } from './filters';
import useClickOutside from './useClickOutside';

interface DropdownFilter {
  title: string;
  options: Option[];
  selected: string[];
  setActive: (a: string[]) => void;
}
export default function DropdownFilter({
  title,
  options,
  selected,
  setActive,
}: DropdownFilter): ReactElement {
  const [filterString, setFilterString] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const dropdown = useRef(null);

  const filteredOptions = options.filter(
    (option) =>
      option.value.toUpperCase().includes(filterString.toUpperCase()) &&
      !selected.includes(option.value)
  );

  useClickOutside(dropdown, isOpen, setIsOpen);

  function handleClickOnTheDropdown(): void {
    if (selected.length !== 0 || filteredOptions.length !== 0) {
      setIsOpen(!isOpen);
    }
  }

  function getDropdownStatus(): string {
    if (selected.length === 0 && filteredOptions.length === 0 && !isOpen) {
      return 'disabled';
    }
    if (isOpen) {
      return 'expanded';
    }
    return '';
  }

  function choosePlaceholder(): string {
    if (selected.length === 0) {
      if (filteredOptions.length > 0) {
        return 'Choose one or multiple';
      }
      return 'No filters apply';
    }
    return '';
  }

  return (
    <div className="DropdownFilter">
      <div className="DropdownFilter__title">{title}</div>
      <div
        className="DropdownFilter__dropdown"
        ref={dropdown}
        role="button"
        tabIndex={0}
        onClick={handleClickOnTheDropdown}
      >
        <div className={`DropdownFilter__search ${getDropdownStatus()}`}>
          {selected.map((selectElement, i) => (
            <span
              className="DropdownFilter__inputElement"
              role="button"
              tabIndex={0}
              onClick={(e) => e.stopPropagation()}
              key={i}
            >
              {selectElement}
              <PillClose
                className="DropdownFilter__inputDelete"
                aria-label="X to remove pill"
                onClick={() => setActive(without(selected, selectElement))}
              />
            </span>
          ))}
          <input
            className={`DropdownFilter__input ${
              selected.length === 0 && filteredOptions.length === 0 && !isOpen
                ? 'disabled'
                : ''
            }`}
            tabIndex={0}
            type="text"
            value={filterString}
            placeholder={choosePlaceholder()}
            size={selected.length !== 0 ? 5 : selected.length}
            onChange={(event) => setFilterString(event.target.value)}
            onClick={(e) => {
              e.stopPropagation();
              if (selected.length !== 0 || filteredOptions.length !== 0) {
                setIsOpen(true);
              }
            }}

          />
          <DropdownArrow
            aria-label="Dropdown arrow"
            className={`DropdownFilter__icon ${getDropdownStatus()}`}
          />
        </div>
        <div className="DropdownFilter__selectable">
          {isOpen &&
            (filteredOptions.length === 0 ? (
              <div
                role="option"
                tabIndex={0}
                aria-selected="true"
                aria-checked="false"
                className="DropdownFilter--noResults"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="DropdownFilter__elementText">
                  No results found.
                </span>
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  role="option"
                  tabIndex={-1}
                  aria-selected="true"
                  aria-checked="false"
                  className="DropdownFilter__element"
                  key={option.value}
                  onClick={(e) => {
                    setActive(
                      selected.includes(option.value)
                        ? pull(selected, option.value)
                        : [...selected, option.value]
                    );
                    setFilterString('');
                    e.stopPropagation();
                  }}
                >
                  <div>
                    <span className="DropdownFilter__elementText">
                      {option.value}
                    </span>
                    <span className="DropdownFilter__elementCount">
                      ({option.count})
                    </span>
                  </div>
                  {option.description ? (
                    <div>
                      <p className="DropdownFilter__elementSubtext">
                        {option.description}
                      </p>
                    </div>
                  ) : (
                    ''
                  )}
                </div>
              ))
            ))}
        </div>
      </div>
    </div>
  );
}
