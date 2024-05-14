import React, { ReactElement } from 'react';
import Modal from '../Modal';
import X from '../icons/X.svg';
import CryingHusky3 from '../icons/crying-husky-3.svg';

interface TestimonialModalProps {
  visible: boolean;
  onCancel: () => void;
}

export default function TestimonialModal({
  visible,
  onCancel,
}: TestimonialModalProps): ReactElement {
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
          <CryingHusky3 />
          <span className="phone-modal__header">We need your help!</span>

          <span className="phone-modal__label">
            Share your testimonial about how we{`'`}ve helped you. Your feedback
            is valuable to us!
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
      </div>
    </Modal>
  );
}
