/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React, { ReactElement, useState } from 'react';
import { UserInfo } from './Header';
import Keys from './Keys';
import CourseCheckBox from './panels/CourseCheckBox';
import { PhoneModal } from './PhoneModal';
import NotifSignUpButton from './ResultsPage/Results/NotifSignUpButton';
import { Course } from './types';

// This file is responsible for the Sign Up for notifications flow.
// First, this will render a button that will say something along the lines of "Get notified when...!"
// Then, if that button is clicked, the Facebook Send To Messenger button will be rendered.
// (This Send To Messenger button is not rendered initially because it requires that an iframe is added and 10+ http requests are made for each time it is rendered)

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
