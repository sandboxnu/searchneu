/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React, { ReactElement, useState } from 'react';
import { UserInfo } from '../components/types';
import Keys from './Keys';
import CourseCheckBox from './panels/CourseCheckBox';
import { PhoneModal } from './PhoneModal';
import NotifSignUpButton from './ResultsPage/Results/NotifSignUpButton';
import { Course } from './types';

type SignUpForNotificationsProps = {
  course: Course;
  userInfo: UserInfo;
  onSignIn: (token: string) => void;
  showNotificationSignup: boolean;
  fetchUserInfo: () => void;
};

export default function SignUpForNotifications({
  course,
  userInfo,
  onSignIn,
  showNotificationSignup,
  fetchUserInfo,
}: SignUpForNotificationsProps): ReactElement {
  const [showModal, setShowModal] = useState(false);

  const checked =
    userInfo && userInfo.courseIds.includes(Keys.getClassHash(course));

  const onNotifSignUp = (): void => {
    setShowModal(true);
  };

  return showNotificationSignup ? (
    userInfo ? (
      <div className="DesktopSectionPanel__notifs">
        Sign up for course-wide notifications:
        <CourseCheckBox
          course={course}
          checked={checked}
          userInfo={userInfo}
          fetchUserInfo={fetchUserInfo}
        />
      </div>
    ) : (
      <>
        <NotifSignUpButton onNotifSignUp={onNotifSignUp} />
        <PhoneModal
          visible={showModal}
          onCancel={() => setShowModal(false)}
          onSignIn={onSignIn}
          onSuccess={() => setShowModal(false)}
        />
      </>
    )
  ) : (
    <div className="allSeatsAvailable">
      <span>There are seats available in all sections.</span>
    </div>
  );
}
