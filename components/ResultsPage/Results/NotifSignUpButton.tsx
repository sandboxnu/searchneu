import React, { ReactElement } from 'react';
import { Button } from 'antd';
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
    <Button onClick={onClickWithAmplitudeHook}>
      Sign up for SMS Notifications
    </Button>
  );
}
