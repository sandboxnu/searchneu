import React, { ReactElement } from 'react';
import macros from '../../macros';
import IconMessage from '../../icons/IconMessage';

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
    <div onClick={onClickWithAmplitudeHook} className="button">
      <IconMessage className="icon" />
      <span>Notify me when seats open!</span>
    </div>
  );
}
