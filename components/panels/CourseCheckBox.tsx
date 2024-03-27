/*
 * This file is part of Search NEU and is licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import { uniqueId } from 'lodash';
import React, { ReactElement, useEffect, useState } from 'react';
import Tooltip, { TooltipDirection } from '../Tooltip';
import Keys from '../Keys';
import { Course, SubscriptionCourse } from '../types';
import axios from 'axios';
import { UserInfo } from '../../components/types';
import SignUpModal from '../notifications/modal/SignUpModal';

type CourseCheckBoxProps = {
  course: Course | SubscriptionCourse;
  userInfo: UserInfo;
  fetchUserInfo: () => void;
  onSignIn: (token: string) => void;
};

export default function CourseCheckBox({
  course,
  userInfo,
  fetchUserInfo,
  onSignIn,
}: CourseCheckBoxProps): ReactElement {
  const [showModal, setShowModal] = useState(false);
  const [notifSwitchId] = useState(uniqueId('notifSwitch-'));

  const isCourseChecked = (): boolean =>
    userInfo && userInfo.courseIds.includes(Keys.getClassHash(course));
  const [checked, setChecked] = useState<boolean>(isCourseChecked);

  useEffect(() => {
    setChecked(isCourseChecked()); // Reset checked status onSignIn/onSignOut
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo]);

  function onCheckboxClick(): void {
    if (!userInfo) {
      setChecked(false);
      setShowModal(true);
    } else {
      setChecked(!checked);
      if (checked) {
        axios
          .delete(
            `${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/user/subscriptions`,
            {
              data: {
                token: userInfo.token,
                sectionIds: [],
                courseIds: [Keys.getClassHash(course)],
              },
            }
          )
          .then(() => fetchUserInfo());
      } else {
        axios
          .put(
            `${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/user/subscriptions`,
            {
              token: userInfo.token,
              sectionIds: [],
              courseIds: [Keys.getClassHash(course)],
            }
          )
          .then(() => fetchUserInfo());
      }
    }
  }

  return (
    <>
      <div className="signUpSwitch toggle">
        <div className="notifSwitch">
          <input
            checked={checked}
            onChange={onCheckboxClick}
            className="react-switch-checkbox"
            id={notifSwitchId}
            type="checkbox"
          />
          <label
            className="react-switch-label"
            style={{ marginTop: '0px' }}
            htmlFor={notifSwitchId}
          >
            <span className="react-switch-button" />
          </label>
        </div>
        <Tooltip
          text={
            checked
              ? 'Unsubscribe from notifications for this course.'
              : 'Subscribe to notifications for this course'
          }
          direction={TooltipDirection.Up}
        />
      </div>
      <SignUpModal
        visible={showModal}
        onCancel={() => setShowModal(false)}
        onSignIn={onSignIn}
        onSuccess={() => {
          setShowModal(false);
        }}
        oneMoreStep={true}
      />
    </>
  );
}
