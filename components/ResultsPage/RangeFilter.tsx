import React, { ReactElement, useEffect, useState } from 'react';
import { ClassRange } from './filters';
import macros from '../macros';

interface RangeFilterProps {
  title: string;
  selected: ClassRange;
  setActive: (a: ClassRange) => void;
}

export default function RangeFilter({
  title,
  selected,
  setActive,
}: RangeFilterProps): ReactElement {
  const [controlledInput, setControlledInput] = useState(selected);

  useEffect(() => {
    setControlledInput(selected);
  }, [selected]);

  return (
    <div className="RangeFilter">
      <div className="RangeFilter__title">
        <p>{title}</p>
      </div>
      <div className="RangeFilter__input">
        <div className="RangeFilter__range-min">
          <input
            type="number"
            className="RangeFilter__input-box"
            placeholder="Min"
            value={controlledInput.min}
            onChange={(event) =>
              setControlledInput({
                min: macros.isNumeric(event.target.value)
                  ? Number(event.target.value)
                  : '',
                max: controlledInput.max,
              })
            }
          />
        </div>
        <div className="RangeFilter__range-max">
          <input
            type="number"
            className="RangeFilter__input-box"
            placeholder="Max"
            value={controlledInput.max}
            onChange={(event) =>
              setControlledInput({
                min: controlledInput.min,
                max: macros.isNumeric(event.target.value)
                  ? Number(event.target.value)
                  : '',
              })
            }
          />
        </div>
        <div
          role="button"
          tabIndex={0}
          className="RangeFilter__apply-input"
          onClick={() =>
            setActive({
              min: controlledInput.min || 0,
              max: controlledInput.max || 9999,
            })
          }
        >
          <p>Apply</p>
        </div>
      </div>
    </div>
  );
}
