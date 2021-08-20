import React, { ReactElement } from 'react';
import { Button } from 'antd';

interface NotifSignUpButtonProps {
  onNotifSignUp: () => void;
}

export default function NotifSignUpButton({
  onNotifSignUp,
}: NotifSignUpButtonProps): ReactElement {
  return <Button onClick={onNotifSignUp}>Sign up for SMS Notifications</Button>;
}
