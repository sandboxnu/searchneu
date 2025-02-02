import { ReactElement } from 'react';
import Keys from '../Keys';
import { UserInfo } from '../types';

type CRNBadgeProps = {
  crn: string;
  userInfo: UserInfo;
};

export const CRNBadge = ({ crn, userInfo }: CRNBadgeProps): ReactElement => {
  const subscribed = userInfo.sectionIds.map((str) =>
    str.substring(str.lastIndexOf('/') + 1)
  );

  return (
    <div className="CRNBadge">
      <div
        className={`CRNBadge__subscribed ${
          userInfo && subscribed.includes(crn)
            ? 'CRNBadge__subscribed--active'
            : ''
        }`}
      ></div>
      <div className="CRNBadge__text">{crn}</div>
    </div>
  );
};
