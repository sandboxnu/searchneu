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

  const courseIDs = [1000, 2000, 3000, 4000, 5000, 6000];
  const courseLabels = courseIDs.map((id) => id.toString());

  let marks = {};
  courseIDs.forEach((id, index) => {
    marks[id] = courseLabels[index];
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
          min={courseIDs.at(0)}
          max={courseIDs.at(-1)}
          defaultValue={[courseIDs.at(0), courseIDs.at(-1)]}
          step={courseIDs.at(0)}
          onChange={(event: number[]) => {
            setControlledInput({
              min: event[0],
              max: event[1],
            });
          }}
          className="RangeFilter__slider"
        />
        {/*
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
        */}
        <div
          role="button"
          tabIndex={0}
          className="RangeFilter__apply-input"
          onClick={() =>
            setActive({
              min: controlledInput.min || courseIDs.at(0),
              max: controlledInput.max || courseIDs.at(-1),
            })
          }
        >
          <p>Apply</p>
        </div>
      </div>
    </div>
  );
}
