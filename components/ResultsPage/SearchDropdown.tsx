import Link from 'next/link';
import React, { ReactElement, useState, useEffect, useRef } from 'react';
import { Dropdown } from 'semantic-ui-react';

interface ItemProps {
  text: string;
  value: string;
  link: string;
}
interface DropdownProps {
  options: ItemProps[];
  value: string;
  className: string;
  compact: boolean;
}

export function SearchDropdown({
  options,
  value: currentValue,
  className = 'searchDropdown',
  compact = false,
}: DropdownProps): ReactElement {
  const currentOption = options.find((o) => o.value == currentValue);
  const currentText = currentOption ? currentOption.text : '';
  return (
    <Dropdown
      fluid
      compact={compact}
      text={currentText}
      className={`selection ${className} ${
        compact ? `${className}--compact` : ''
      }`}
    >
      <Dropdown.Menu>
        {options.map(({ text, value, link }) => (
          <Link key={value} href={link}>
            <Dropdown.Item selected={currentValue == value} text={text} />
          </Link>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export function MobileSearchDropdown({
  options,
  value: currentValue,
  className = 'searchDropdown',
  compact = false,
}: DropdownProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = options.find((o) => o.value === currentValue);
  const currentText = currentOption ? currentOption.text : '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`mobile-search-dropdown ${className} ${
        compact ? `${className}--compact` : ''
      }`}
    >
      <button
        className="mobile-search-dropdown-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentText}

        <img
          src="/semester-dropdown-arrow.svg"
          alt="Dropdown Arrow"
          className={`dropdown-arrow ${isOpen ? 'flipped' : ''}`}
        />
      </button>

      {isOpen && (
        <ul className="mobile-search-dropdown-menu">
          {options.map(({ text, value, link }) => (
            <li key={value}>
              <a href={link} onClick={() => setIsOpen(false)}>
                {text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default React.memo(SearchDropdown);
