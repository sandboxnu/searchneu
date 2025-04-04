import React, { ReactElement } from 'react';
import Modal from '../Modal';
import X from '../icons/X.svg';
import DonateHusky from '../icons/donate-husky.svg';

interface GivingDayModalProps {
  visible: boolean;
  onCancel: () => void;
}

export default function GivingDayModal({
  visible,
  onCancel,
}: GivingDayModalProps): ReactElement {
  return (
    <Modal visible={visible} onCancel={onCancel}>
      <div className="phone-modal">
        <div className="phone-modal__body">
          <div className="phone-modal__action-btns">
            <button
              onClick={onCancel}
              className="phone-modal__action-btn phone-modal__action-btn--x"
            >
              <X />
            </button>
          </div>
          <DonateHusky />
          <span className="phone-modal__header">It's almost Giving Day!</span>

          <span className="phone-modal__label">
            On April 10th, make a donation to Sandbox
            <a href="https://givingday.northeastern.edu/pages/northeastern-giving-day">
              {' '}
              here
            </a>{' '}
            to help keep SearchNEU running!
          </span>

          {/* <div className="phone-modal__button-container">
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
          </div> */}
        </div>
      </div>
    </Modal>
  );
}
