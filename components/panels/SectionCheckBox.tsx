/*
 * This file is part of Search NEU and is licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import { uniqueId } from 'lodash';
import React, { ReactElement, useState } from 'react';
import { Icon } from 'semantic-ui-react';
import Tooltip, { TooltipDirection } from '../Tooltip';
import Keys from '../Keys';
import { Section } from '../types';
import axios from 'axios';
import { UserInfo } from '../../components/types';
import Colors from '../../styles/_exports.module.scss';

type SectionCheckBoxProps = {
  section: Section;
  checked: boolean;
  userInfo: UserInfo;
  fetchUserInfo: () => void;
};

export default function SectionCheckBox({
  section,
  checked,
  userInfo,
  fetchUserInfo,
}: SectionCheckBoxProps): ReactElement {
  const [notifSwitchId] = useState(uniqueId('notifSwitch-'));

  function onCheckboxClick(): void {
    if (checked) {
      axios
        .delete(
          `${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/user/subscriptions`,
          {
            data: {
              token: userInfo.token,
              sectionIds: [Keys.getSectionHash(section)],
              courseIds: [],
            },
          }
        )
        .then(() => fetchUserInfo());
    } else {
      axios
        .put(`${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/user/subscriptions`, {
          token: userInfo.token,
          sectionIds: [Keys.getSectionHash(section)],
          courseIds: [],
        })
        .then(() => fetchUserInfo());
    }
  }

  if (section.seatsRemaining > 5) {
    return (
      <div
        style={{ color: Colors.light_grey }}
        data-tip="There are still seats remaining for this section"
        className="infoIcon"
      >
        <Icon name="info circle" className="myIcon" />
        <Tooltip
          text={'There are still seats remaining for this section'}
          direction={TooltipDirection.Up}
        />
      </div>
    );
  }

  return (
    <div className="signUpSwitch">
      <div className="notifSwitch">
        <input
          checked={checked}
          onChange={onCheckboxClick}
          className="notif-switch-checkbox"
          id={notifSwitchId}
          type="checkbox"
        />
        <label className="notif-switch-label" htmlFor={notifSwitchId}>
          <span className="notif-switch-button" />
        </label>
      </div>
      <Tooltip
        text={
          checked
            ? 'Unsubscribe from notifications for this section.'
            : 'Subscribe to notifications for this section'
        }
        direction={TooltipDirection.Up}
      />
    </div>
  );
}
