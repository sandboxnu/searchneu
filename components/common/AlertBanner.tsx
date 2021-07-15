import React, { useState } from 'react';
import IconClose from '../icons/IconClose';

type AlertLevel = 'error' | 'warning' | 'info';

type AlertBannerProps = {
  alertLevel: AlertLevel;
  alertMessage: string;
};

export default function AlertBanner({
  alertLevel,
  alertMessage,
}: AlertBannerProps) {
  const [isBannerOpen, setIsBannerOpen] = useState(true);

  const closeBanner = () => setIsBannerOpen(false);

  return (
    isBannerOpen && (
      <div className={`alertBanner ${alertLevel}Banner`}>
        {alertMessage}
        <div
          className="alertBanner__back"
          role="button"
          tabIndex={0}
          onClick={closeBanner}
        >
          <IconClose fill="#808080" />
        </div>
      </div>
    )
  );
}
