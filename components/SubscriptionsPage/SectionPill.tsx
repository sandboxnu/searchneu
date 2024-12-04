import { ReactElement } from 'react';
import Keys from '../Keys';
import { UserInfo } from '../types';

type SectionPillProps = {
  crn: string;
  userInfo: UserInfo;
};

export const SectionPill = ({
  crn,
  userInfo,
}: SectionPillProps): ReactElement => {
  return (
    <div className="SectionPill">
      <div
        className={`SectionPill__subscribed ${
          userInfo && userInfo.courseIds.includes(Keys.getClassHash(crn))
            ? 'SectionPill__subscribed--active'
            : ''
        }`}
      ></div>
      <div className="SectionPill__text">{crn}</div>
    </div>
  );
};
