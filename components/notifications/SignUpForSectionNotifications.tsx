/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React, { ReactElement } from 'react';
import { UserInfo } from '../types';
import CourseCheckBox from '../panels/CourseCheckBox';
import { Course } from '../types';

type SignUpForSectionNotificationsProps = {
  course: Course;
  userInfo: UserInfo;
  showNotificationSignup: boolean;
  fetchUserInfo: () => void;
  onSignIn: (token: string) => void;
};

export default function SignUpForSectionNotifications({
  course,
  userInfo,
  showNotificationSignup,
  fetchUserInfo,
  onSignIn,
}: SignUpForSectionNotificationsProps): ReactElement {
  const numOpenSections = course.sections.reduce((prev, cur) => {
    if (cur.seatsRemaining > 0) {
      return prev + 1;
    }
    return prev;
  }, 0);

  const openSectionsText =
    numOpenSections === 1
      ? 'There is 1 section with seats left.'
      : `There are ${numOpenSections} sections with seats left.`;

  return showNotificationSignup ? (
    userInfo ? (
      <div className="DesktopSectionPanel__notifs">
        <span className="checkboxLabel">
          Notify me when new sections are added:
        </span>
        <CourseCheckBox
          onSignIn={onSignIn}
          course={course}
          userInfo={userInfo}
          fetchUserInfo={fetchUserInfo}
        />
      </div>
    ) : (
      // Need to replace this once mobile notifs are finalized
      <>Sign in for new section notifications.</>
    )
  ) : (
    <div className="allSeatsAvailable">
      <span>{openSectionsText}</span>
    </div>
  );
}
