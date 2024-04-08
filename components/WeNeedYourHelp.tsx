import { MoonLoader } from 'react-spinners';
import React, { ReactElement, useEffect, useState } from 'react';
import Modal from './Modal';
import X from './icons/X.svg';
import CryingHusky3 from './icons/crying-husky-3.svg';

import Colors from '../styles/_exports.module.scss';

interface WeNeedYourHelpProps {
  visible: boolean;
  onCancel: () => void;
}

export default function WeNeedYourHelp({
  visible,
  onCancel,
}: WeNeedYourHelpProps): ReactElement {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  });

  return (
    <Modal visible={visible} onCancel={onCancel}>
      <div className="phone-modal">
        {isLoading && (
          <div className="phone-modal__spinner">
            <MoonLoader color={Colors.aqua} loading={true} size={32} />
          </div>
        )}

        <>
          <div className="phone-modal__body">
            <div className="phone-modal__action-btns">
              <button
                onClick={onCancel}
                className="phone-modal__action-btn phone-modal__action-btn--x"
              >
                <X />
              </button>
            </div>
            <CryingHusky3 />
            <span className="phone-modal__header">We need your help!</span>

            <span className="phone-modal__label">
              Share your testimonial about how we{`'`}ve helped you. Your
              feedback is valuable to us!
            </span>

            <div className="phone-modal__button-container">
              <button
                key="ok"
                onClick={() => {
                  window.open(
                    'https://docs.google.com/forms/d/e/1FAIpQLSdOWqfXW4KJZNbHI9hbQohfsY9BIJnxLSuUz8p_DIx4bZkZ9A/viewform',
                    '_blank'
                  );
                  onCancel();
                }}
                className="phone-modal__btn phone-modal__btn--primary"
              >
                Fill out the Google Form
              </button>
            </div>
          </div>
        </>
      </div>
    </Modal>
  );
}
