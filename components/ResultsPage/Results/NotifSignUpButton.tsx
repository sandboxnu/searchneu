import React, { ReactElement } from 'react';
import macros from '../../macros';

interface NotifSignUpButtonProps {
  onNotifSignUp: () => void;
}

export default function NotifSignUpButton({
  onNotifSignUp,
}: NotifSignUpButtonProps): ReactElement {
  const onClickWithAmplitudeHook = (): void => {
    onNotifSignUp();
    macros.logAmplitudeEvent('Notifs Button');
  };

  const NOTIFICATIONS_ARE_DISABLED = true;

  return (
    <button
      disabled={NOTIFICATIONS_ARE_DISABLED}
      onClick={onClickWithAmplitudeHook}
      type="button"
      className={`Results_SignIn ${NOTIFICATIONS_ARE_DISABLED && 'disabledButton'}`}
    >
      Sign In
    </button>
  );
}
