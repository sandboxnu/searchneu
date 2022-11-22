import React, { ReactElement, useEffect, useState } from 'react';
import { ClassRange } from './filters';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

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

  const courseIDs = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];
  const marks = {};
  courseIDs.forEach((id) => {
    marks[id] = id.toString();
  });

  useEffect(() => {
    setControlledInput(selected);
  }, [selected]);

  return (
    <div className="RangeFilter">
      <div className="RangeFilter__title">
        <p>{title}</p>
      </div>
      <div className="RangeFilter__input">
        <Slider
          range
          marks={marks}
          allowCross={false}
          min={courseIDs[0]}
          max={courseIDs[courseIDs.length - 1]}
          defaultValue={[courseIDs[0], courseIDs[courseIDs.length - 1]]}
          step={courseIDs[0]}
          onChange={(event: number[]) => {
            setControlledInput({
              min: event[0],
              max: event[1],
            });
          }}
          className="RangeFilter__slider"
          value={[
            controlledInput.min || courseIDs[0],
            controlledInput.max || courseIDs[courseIDs.length - 1],
          ]}
        />
        <div
          role="button"
          tabIndex={0}
          className="RangeFilter__apply-input"
          onClick={() =>
            setActive({
              min: controlledInput.min || courseIDs[0],
              max: controlledInput.max || courseIDs[courseIDs.length - 1],
            })
          }
        >
          <p>Apply</p>
        </div>
      </div>
    </div>
  );
}
