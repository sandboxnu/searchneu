/*
 * This file is part of Search NEU and is licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import { uniqueId } from 'lodash';
import React, { ReactElement, useState } from 'react';
import { Icon } from 'semantic-ui-react';
import useUser from '../../utils/useUser';
import IconCheckMark from '../icons/IconCheckmark';
import Tooltip, { TooltipDirection } from '../Tooltip';
import Keys from '../Keys';
import macros from '../macros';
import { Section } from '../types';
import axios from 'axios';
import { UserInfo } from '../Header';

type NotifCheckBoxProps = {
  section: Section;
  checked: boolean;
  userInfo: UserInfo;
  fetchUserInfo: () => void;
};

export default function NotifCheckBox({
  section,
  checked,
  userInfo,
  fetchUserInfo,
}: NotifCheckBoxProps): ReactElement {
  // const { user, subscribeToSection, unsubscribeFromSection } = useUser();

  // const checked = user?.followedSections?.includes(
  //   Keys.getSectionHash(section)
  // );

  const [notifSwitchId] = useState(uniqueId('notifSwitch-'));

  function onCheckboxClick(): void {
    if (checked) {
      axios
        .delete('http://localhost:8080/user/subscriptions', {
          data: {
            token: userInfo.token,
            sectionIds: [Keys.getSectionHash(section)],
            courseIds: [],
          },
        })
        .then(() => fetchUserInfo());
    } else {
      axios
        .put('http://localhost:8080/user/subscriptions', {
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
        style={{ color: '#d3d3d3' }}
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
      {macros.isMobile ? (
        <div
          className={
            checked ? 'notifSubscribeButton--checked' : 'notifSubscribeButton'
          }
          role="button"
          tabIndex={0}
          onClick={onCheckboxClick}
        >
          {checked && <IconCheckMark />}
          <span>{checked ? 'Subscribed' : 'Subscribe'}</span>
        </div>
      ) : (
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
      )}
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
