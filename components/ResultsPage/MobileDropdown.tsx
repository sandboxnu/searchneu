import Link from 'next/link';
import React, { ReactElement } from 'react';
import { Dropdown } from 'semantic-ui-react';
import DropdownArrow from '../icons/DropdownArrow.svg';
import { getTermName, TermInfo } from '../terms';
import { Campus } from '../types';

interface ItemProps {
  text: string;
  value: string;
  link: string;
}
interface DropdownProps {
  options: ItemProps[];
  termId: string;
  termInfos: Record<Campus, TermInfo[]>;
}

function MobileSemesterDropdown({
  options,
  termId: currentTerm,
  termInfos,
}: DropdownProps): ReactElement {
  const currSemester = getTermName(termInfos, currentTerm).split(' ');
  const semester =
    currSemester.length == 3
      ? currSemester[0]
      : currSemester[0] + ' ' + currSemester[1];
  const currYear = currSemester.length == 3 ? currSemester[1] : currSemester[2];
  const currText = semester + ' (' + currYear + ')';
  return (
    <Dropdown
      fluid
      text={currText}
      className="MobileDropdown"
      icon={DropdownArrow}
    >
      <Dropdown.Menu className="MobileDropdown__Menu">
        {options.map(({ text, value, link }) => (
          <Link key={value} href={link}>
            <Dropdown.Item selected={currentTerm == value} text={text} />
          </Link>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default React.memo(MobileSemesterDropdown);
