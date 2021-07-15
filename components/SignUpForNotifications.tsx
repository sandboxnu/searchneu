/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import axios from 'axios';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { Button, Modal } from 'semantic-ui-react';
import { GetMessengerTokenResponse } from '../pages/api/user/messenger_token';
import useUser from '../utils/useUser';
import facebook from './facebook';
import LogoInput from './icons/LogoInput';
import Keys from './Keys';
import macros from './macros';
import { Course } from './types';

// This file is responsible for the Sign Up for notifications flow.
// First, this will render a button that will say something along the lines of "Get notified when...!"
// Then, if that button is clicked, the Facebook Send To Messenger button will be rendered.
// (This Send To Messenger button is not rendered initially because it requires that an iframe is added and 10+ http requests are made for each time it is rendered)

type SignUpForNotificationsProps = {
  course: Course;
};

export default function SignUpForNotifications({
  course,
}: SignUpForNotificationsProps): ReactElement {
  const [showMessengerButton, setShowMessengerButton] = useState(false);
  // Keeps track of whether the adblock modal is being shown or not
  // Sometimes, adblock will block the FB plugin from loading
  // Firefox strict browsing also blocks this plugin from working
  // If the plugin failed to load for whatever reason, show this message and ask the user to allow FB plugins
  const [showAdblockModal, setShowAdblockModal] = useState(false);
  const courseHash = Keys.getClassHash(course);

  const [tokens, setTokens] = useState<GetMessengerTokenResponse>(null);

  // After the button is added to the DOM, we need to tell FB's SDK that it was added to the code and should be processed.
  // This will tell FB's SDK to scan all the child elements of this.facebookScopeRef to look for fb-send-to-messenger buttons.
  // If the user goes to this page and is not logged into Facebook, a send to messenger button will still appear and they
  // will be asked to sign in after clicking it.
  const facebookScopeRef = useRef(null);

  const { user, subscribeToCourse, subscribeToSection } = useUser();

  useEffect(() => {
    (async () => {
      if (!facebookScopeRef.current) {
        return;
      }

      const FB = await facebook.getFBPromise();

      // Check for this.facebookScopeRef again because some rollbar errors were coming in that it was changed to null
      // while the await above was running
      // https://rollbar.com/ryanhugh/searchneu/items/373/
      if (!FB || !facebookScopeRef.current) {
        return;
      }

      FB.XFBML.parse(facebookScopeRef.current);

      const iframe = facebookScopeRef.current.querySelector('iframe');

      if (!iframe) {
        macros.logAmplitudeEvent('FB Send to Messenger', {
          message: 'Unable to load iframe for send to messenger plugin.',
          hash: Keys.getClassHash(course),
        });
        macros.error('No iframe?');
        return;
      }

      iframe.onload = () => {
        // Check to see if the plugin was successfully rendered
        const ele = facebookScopeRef.current.querySelector(
          '.sendToMessengerButton > span'
        );

        const classHash = Keys.getClassHash(course);

        // If has adblock and haven't shown the warning yet, show the warning.
        if (
          ele.offsetHeight === 0 &&
          ele.offsetWidth === 0 &&
          !facebook.didPluginRender()
        ) {
          if (macros.isMobile) {
            macros.error('Unable to render on mobile?', classHash);

            macros.logAmplitudeEvent('FB Send to Messenger', {
              message: 'Unable to render on mobile?.',
              hash: classHash,
            });
          } else {
            macros.logAmplitudeEvent('FB Send to Messenger', {
              message:
                "User has adblock or isn't logged in. Showing adblock/login popup.",
              hash: classHash,
            });

            setShowAdblockModal(true);
            facebook.pluginFailedToRender();
          }
        } else {
          macros.logAmplitudeEvent('FB Send to Messenger', {
            message: 'Successfully rendered',
            hash: classHash,
          });
        }
      };
    })().catch((e) => macros.error(e));
  }, [course, showMessengerButton]);

  // Updates the state to show the button.
  const onSubscribeToggleChange = async (): Promise<void> => {
    // if a user exists already, we can show the notification checkboxes too
    if (user) {
      macros.log('user exists already', user);

      await subscribeToCourse(course);

      // If this class only has 1 section, sign the user for it automatically.
      if (
        course.sections &&
        course.sections.length === 1 &&
        course.sections[0].seatsRemaining <= 0
      ) {
        subscribeToSection(course.sections[0]);
      }
    } else {
      macros.logAmplitudeEvent('FB Send to Messenger', {
        message: 'First button click',
        hash: Keys.getClassHash(course),
      });

      if (!tokens) {
        setTokens((await axios.get('/api/user/messenger_token')).data);
      }
      facebook.setCourseToSubscribeToAfterLogin(courseHash);

      // Check the status of the FB plugin
      // If it failed to load, show the message that asks user to disable adblock
      setShowMessengerButton(true);
      try {
        await facebook.getFBPromise();
      } catch (e) {
        setShowAdblockModal(true);
      }
    }
  };

  // Return the FB button itself.
  const getSendToMessengerButton = () => {
    // TODO: login and subscribe after button
    const dataRef = tokens.messengerToken;

    return (
      <div ref={facebookScopeRef} className="inlineBlock">
        <div
          className="fb-send-to-messenger sendToMessengerButton"
          data-ref={dataRef}
          color="white"
          {...{
            // This is cursed, but we're using spread to get around the fact that
            // Facebook needs custom props on a div -- something not supported by TS
            messenger_app_id: process.env.NEXT_PUBLIC_FB_APP_ID,
            page_id: process.env.NEXT_PUBLIC_FB_PAGE_ID,
            size: 'large',
          }}
        />
      </div>
    );
  };

  const hasAtLeastOneSectionFull = () => {
    return course.sections.some((e) => {
      return e.seatsRemaining <= 0 && e.seatsCapacity > 0;
    });
  };

  let content = null;

  if (user?.followedCourses?.includes(courseHash)) {
    if (course.sections.length === 0) {
      content = (
        <Button
          basic
          disabled
          content="You're now signed up for notifications on this class"
          className="notificationButton"
        />
      );
    } else {
      content = (
        <div className="toggleCTA">
          <span>Toggle the sections you want to be notified for!</span>
        </div>
      );
    }
  } else if (showMessengerButton && tokens) {
    if (facebook.didPluginFail()) {
      content = (
        <Button
          basic
          content="Disable adblock to continue"
          className="diableAdblockButton"
          disabled
        />
      );
    } else {
      content = (
        <div className="facebookButtonContainer">
          <div className="sendToMessengerButtonLabel">
            Click this button to continue
          </div>
          {getSendToMessengerButton()}
        </div>
      );
    }
  } else if (course.sections.length === 0) {
    content = (
      <Button
        basic
        disabled
        onClick={onSubscribeToggleChange}
        content="Get notified when sections are added!"
        className="notificationButton"
      />
    );
  } else if (hasAtLeastOneSectionFull()) {
    content = (
      <div
        className="initialNotificationButton"
        role="button"
        tabIndex={0}
        onClick={onSubscribeToggleChange}
      >
        <LogoInput height="14" width="18" fill="#d41b2c" />
        <span>Get notified when seats open up!</span>
      </div>
    );
  } else {
    // Show a button that says there are currently seats available.
    content = (
      <div className="allSeatsAvailable">
        <span>There are seats available in all sections.</span>
      </div>
    );
  }

  const actions = [
    {
      key: 'done',
      content: 'Ok',
      positive: true,
      onClick: () => setShowAdblockModal(false),
    },
  ];

  // TODO: Remove this after notifications are re-enabled
  content = (
    <Button
      basic
      disabled
      content="The notification feature is temporarily disabled"
      className="notificationButton"
    />
  );

  return (
    <div className="sign-up-for-notifications-container">
      {content}
      <Modal
        header="Please disable adblock and sign into Facebook."
        open={showAdblockModal}
        content="Please disable any ad blocking extentions for this site because this feature does not work when adblock is enabled. If you are using Firefox in strict blocking mode, you will need to add an exception for this site for this feature to work. You will also have to uninstall Facebook Container for Firefox, if you have that installed. You can also try using a different browser. If you can't get it working send us a message at hey@searchneu.com."
        actions={actions}
      />
    </div>
  );
}
