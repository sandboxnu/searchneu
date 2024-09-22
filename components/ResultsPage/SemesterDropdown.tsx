import React, { ReactElement, useRef, useState } from 'react';
import useClickOutside from './useClickOutside';
import DropdownArrow from '../icons/DropdownArrow.svg';
import { ItemProps } from 'semantic-ui-react';
import { useRouter } from 'next/router';

interface SemesterDropdownProps {
  title: string;
  options: ItemProps[];
  value: string;
}
function SemesterDropdown({
  title,
  options,
  value: currentValue,
}: SemesterDropdownProps): ReactElement {
  const currentOption = options.find((o) => o.value == currentValue);
  const currentText = currentOption ? currentOption.text : '';
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  const dropdown = useRef(null);

  useClickOutside(dropdown, isOpen, setIsOpen);

  function getDropdownStatus(): string {
    if (isOpen) {
      return 'expanded';
    }
    return '';
  }

  return (
    <div className="DropdownFilter SemesterDropdown">
      <div className="DropdownFilter__title">{title}</div>
      <div
        className="DropdownFilter__dropdown"
        ref={dropdown}
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`DropdownFilter__search ${getDropdownStatus()}`}>
          <div aria-label={currentText}>{currentText}</div>
          <DropdownArrow
            aria-label="Dropdown arrow"
            className={`DropdownFilter__icon ${getDropdownStatus()}`}
          />
        </div>
        <div className="DropdownFilter__selectable">
          {isOpen && (
            <>
              {options.map(({ text, value, link }) => (
                <div
                  key={value}
                  onClick={() => router.push(link)}
                  className="DropdownFilter__element"
                  aria-selected="true"
                  aria-checked="false"
                >
                  <div>
                    <span className="DropdownFilter__elementText">{text}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(SemesterDropdown);
