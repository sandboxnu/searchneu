/*
 * This file is part of Search NEU and is licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import { uniqueId } from 'lodash';
import React, { ReactElement, useEffect, useState } from 'react';
import { Icon } from 'semantic-ui-react';
import Tooltip, { TooltipDirection } from '../Tooltip';
import Keys from '../Keys';
import { Section } from '../types';
import axios from 'axios';
import { UserInfo } from '../../components/types';
import Colors from '../../styles/_exports.module.scss';
import SignUpModal from '../notifications/modal/SignUpModal';
import { useRouter } from 'next/router';

type SectionCheckBoxProps = {
  section: Section;
  userInfo: UserInfo;
  fetchUserInfo: () => void;
  onSignIn: (token: string) => void;
};

export default function SectionCheckBox({
  section,
  userInfo,
  fetchUserInfo,
  onSignIn,
}: SectionCheckBoxProps): ReactElement {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [notifSwitchId] = useState(uniqueId('notifSwitch-'));

  const NOTIFICATIONS_LIMIT = 12;
  const NOTIFICATIONS_ARE_DISABLED = false;

  const termId = router.query.termId as string;

  const notificationsLimitReached = (): boolean =>
    NOTIFICATIONS_ARE_DISABLED ||
    (userInfo &&
      userInfo.courseIds.filter((id) => id.includes(termId)).length +
        userInfo.sectionIds.filter((id) => id.includes(termId)).length >=
        NOTIFICATIONS_LIMIT);

  const isSectionChecked = (): boolean =>
    userInfo
      ? userInfo.sectionIds.includes(Keys.getSectionHash(section))
      : false;
  const [checked, setChecked] = useState<boolean>(isSectionChecked());

  useEffect(() => {
    setChecked(isSectionChecked()); // Reset checked status onSignIn/onSignOut
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
                sectionIds: [Keys.getSectionHash(section)],
                courseIds: [],
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
              sectionIds: [Keys.getSectionHash(section)],
              courseIds: [],
            }
          )
          .then(() => fetchUserInfo());
      }
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
    <>
      <div className="signUpSwitch">
        <div className="notifSwitch">
          <input
            disabled={checked ? false : notificationsLimitReached()}
            checked={checked}
            onChange={onCheckboxClick}
            className="react-switch-checkbox"
            id={notifSwitchId}
            type="checkbox"
          />
          <label
            className={`react-switch-label ${
              !checked && notificationsLimitReached() && 'disabledButton'
            }`}
            style={{
              marginTop: '0px',
              cursor: `${
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
