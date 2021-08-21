import React, { useState } from 'react';
import IconClose from '../icons/IconClose';

type AlertLevel = 'error' | 'warning' | 'info';

export type AlertBannerData = {
  text: string;
  alertLevel: AlertLevel;
  link?: string;
};

type AlertBannerProps = {
  alertBannerData: AlertBannerData;
};

export default function AlertBanner({ alertBannerData }: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    isVisible && (
      <div className={`alertBanner ${alertBannerData.alertLevel}Banner`}>
        <span>
          {alertBannerData.text}
          {alertBannerData.link && (
            <a href={alertBannerData.link}> Learn More.</a>
          )}
        </span>
        <div
          className="alertBanner__back"
          role="button"
          tabIndex={0}
          onClick={() => setIsVisible(false)}
        >
          <IconClose fill="#808080" />
        </div>
      </div>
    )
  );
}
