import React, { useState } from 'react';
import macros from '../macros';
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
      //if on mobile, it'll put the text and button into columns.
      <div
        className={
          macros.isMobile ? 'alertBanner__parent' : 'alertBanner__mobileParent'
        }
      >
        <div className={`alertBanner ${alertBannerData.alertLevel}Banner`}>
          <div className="alertBanner__text">
            <span>
              {alertBannerData.text}
              {alertBannerData.link && (
                <a href={alertBannerData.link}> Learn More.</a>
              )}
            </span>
          </div>
          <div
            className="alertBanner__back"
            role="button"
            tabIndex={0}
            onClick={() => setIsVisible(false)}
          >
            <IconClose fill="#808080" />
          </div>
        </div>
      </div>
    )
  );
}
