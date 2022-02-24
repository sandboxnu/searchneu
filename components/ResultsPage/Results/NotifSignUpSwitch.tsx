import React, { ReactElement } from 'react';
import macros from '../../macros';

interface NotifSignUpSwitchProps {
  onNotifSignUp: () => void;
}

export default function NotifSignUpSwitch({
  onNotifSignUp,
}: NotifSignUpSwitchProps): ReactElement {
  const onClickWithAmplitudeHook = (): void => {
    onNotifSignUp();
    macros.logAmplitudeEvent('Notifs Switch');
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.checked) {
      onClickWithAmplitudeHook();
    }
  };

  return (
    /*<Button className="tester" onClick={onClickWithAmplitudeHook}>
      Sign up for SMS Notifications
    </Button>*/
    <div className="wrapper">
      <span className="label">Notify me when new sections are added:</span>
      <label className="switch">
        <input type="checkbox" onChange={handleChange} />
        <span className="slider round"></span>
      </label>
    </div>
  );
}
