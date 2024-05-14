import React, { ReactElement, useState } from 'react';
import macros from '../macros';
import IconClose from '../icons/IconClose';
import Colors from '../../styles/_exports.module.scss';
import GraduateLogo from '../icons/GraduateLogo';

type AlertLevel = 'error' | 'warning' | 'info';

export type AlertBannerData = {
  text: string;
  alertLevel: AlertLevel;
  link?: string;
  linkText?: string;
  logo?: () => ReactElement;
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
            {alertBannerData.logo && (
              <span className="alertBanner__logo">
                <alertBannerData.logo />
              </span>
            )}
            <span>
              {alertBannerData.text}
              {alertBannerData.link && (
                <a href={alertBannerData.link} target="_blank" rel="noreferrer">
                  {' '}
                  {alertBannerData.linkText
                    ? alertBannerData.linkText
                    : 'Learn More'}
                </a>
              )}
            </span>
          </div>
          <div
            className="alertBanner__back"
            role="button"
            tabIndex={0}
            onClick={() => setIsVisible(false)}
          >
            <IconClose fill={Colors.grey} />
          </div>
        </div>
      </div>
    )
  );
}
