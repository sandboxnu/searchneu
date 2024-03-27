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

  return (
    <button
      onClick={onClickWithAmplitudeHook}
      type="button"
      className="Results_SignIn"
    >
      Sign In
    </button>
  );
}
