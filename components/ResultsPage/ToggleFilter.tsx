import { uniqueId } from 'lodash';
import React, { ChangeEvent, ReactElement, useState } from 'react';

interface ToggleFilterProps {
  title: string;
  selected: boolean;
  setActive: (a: boolean) => void;
}

export default function ToggleFilter({
  title,
  selected,
  setActive,
}: ToggleFilterProps): ReactElement {
  const [id] = useState(uniqueId('react-switch-'));
  const onChange = (event: ChangeEvent<HTMLInputElement>): void =>
    setActive(event.target.checked);
  return (
    <div className="toggleFilter">
      <div className="filter__title">
        <p>{title}</p>
      </div>
      <div className="toggleSwitch">
        <input
          className="react-switch-checkbox"
          type="checkbox"
          onChange={onChange}
          id={id}
          checked={selected}
        />
        <label className="react-switch-label" htmlFor={id}>
          <span className={'react-switch-button'} />
        </label>
      </div>
    </div>
  );
}
