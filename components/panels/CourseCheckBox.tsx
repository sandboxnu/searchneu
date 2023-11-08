/*
 * This file is part of Search NEU and is licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import { uniqueId } from 'lodash';
import React, { ReactElement, useState } from 'react';
import Tooltip, { TooltipDirection } from '../Tooltip';
import Keys from '../Keys';
import { Course } from '../types';
import axios from 'axios';
import { UserInfo } from '../../components/types';

type CourseCheckBoxProps = {
  course: Course;
  checked: boolean;
  userInfo: UserInfo;
  fetchUserInfo: () => void;
};

export default function CourseCheckBox({
  course,
  checked,
  userInfo,
  fetchUserInfo,
}: CourseCheckBoxProps): ReactElement {
  const [notifSwitchId] = useState(uniqueId('notifSwitch-'));

  function onCheckboxClick(): void {
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
        .put(`${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/user/subscriptions`, {
          token: userInfo.token,
          sectionIds: [],
          courseIds: [Keys.getClassHash(course)],
        })
        .then(() => fetchUserInfo());
    }
  }

  return (
    <div className="signUpSwitch">
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
  );
}
