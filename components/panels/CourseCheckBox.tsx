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

  const NOTIFICATIONS_LIMIT = 12;
  const NOTIFICATIONS_ARE_DISABLED = false;

  const notificationsLimitReached = (): boolean =>
    NOTIFICATIONS_ARE_DISABLED ||
    (userInfo &&
      userInfo.courseIds.length + userInfo.sectionIds.length >=
        NOTIFICATIONS_LIMIT);

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
            //disabled={notificationsLimitReached()}
            disabled={checked ? false : notificationsLimitReached()}
            checked={checked}
            onChange={onCheckboxClick}
            className="react-switch-checkbox"
            id={notifSwitchId}
            type="checkbox"
          />
          <label
            //className={`react-switch-label ${NOTIFICATIONS_ARE_DISABLED && 'disabledButton'}`}
            className={`react-switch-label ${
              //notificationsLimitReached()
              !checked && notificationsLimitReached() && 'disabledButton'
            }`}
            style={{
              marginTop: '0px',
              cursor: `${
                //notificationsLimitReached() ? 'not-allowed' : 'inherit'
                !checked && notificationsLimitReached()
                  ? 'not-allowed'
                  : 'inherit'
              }`,
            }}
            htmlFor={notifSwitchId}
          >
            <span className="react-switch-button" />
          </label>
        </div>
        {checked ||
          (!notificationsLimitReached() && (
            <Tooltip
              text={
                !userInfo
                  ? 'Sign in to subscribe for notifications.'
                  : checked
                  ? 'Unsubscribe from notifications for this section.'
                  : 'Subscribe to notifications for this section'
              }
              direction={TooltipDirection.Up}
            />
          ))}
        {!checked && notificationsLimitReached() && (
          <Tooltip
            text="Notification limit reached - unsubscribe to add more."
            direction={TooltipDirection.Up}
          />
        )}
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
