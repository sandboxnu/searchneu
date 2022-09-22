import { uniqueId } from 'lodash';
import React, { ReactElement, useState } from 'react';

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
  const onChange = (event) => setActive(event.target.checked);
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
          defaultChecked={selected}
          checked={selected}
        />
        <label className="react-switch-label" htmlFor={id}>
          <span className={'react-switch-button'} />
        </label>
      </div>
    </div>
  );
}
