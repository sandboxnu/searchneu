import Link from 'next/link';
import React, { ReactElement } from 'react';
import { Dropdown } from 'semantic-ui-react';
import DropdownArrow from '../icons/DropdownArrow.svg';

interface ItemProps {
  text: string;
  value: string;
  link: string;
}
interface DropdownProps {
  options: ItemProps[];
  value: string;
}

function MobileDropdown({
  options,
  value: currentValue,
}: DropdownProps): ReactElement {
  const currentOption = options.find((o) => o.value == currentValue);
  const currentText = currentOption ? currentOption.text : 'Spring (2025)';
  return (
    <Dropdown
      fluid
      text={currentText}
      className="MobileDropdown"
      icon={DropdownArrow}
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

export default React.memo(MobileDropdown);
