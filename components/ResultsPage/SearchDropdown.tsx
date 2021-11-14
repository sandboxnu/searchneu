import Link from 'next/link';
import React, { ReactElement } from 'react';
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

function SearchDropdown({
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

export default React.memo(SearchDropdown);
