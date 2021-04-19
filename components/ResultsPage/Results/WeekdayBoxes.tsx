import React, { ReactElement } from 'react';
import { MeetingType } from '../../types';

interface WeekdayBoxesProps {
  meetingDays: boolean[];
  meetingType: MeetingType;
}

function WeekdayBoxes({
  meetingDays,
  meetingType,
}: WeekdayBoxesProps): ReactElement {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="WeekdayBoxes">
      {meetingDays.map((box, index) => {
        return (
          // eslint-disable-next-line react/no-array-index-key
          <span
            key={index}
            className={`WeekdayBoxes__box${
              box
                ? meetingType === MeetingType.CLASS
                  ? '--checked-class'
                  : '--checked-final'
                : ''
            }`}
          >
            {days[index]}
          </span>
        );
      })}
    </div>
  );
}

export default WeekdayBoxes;
