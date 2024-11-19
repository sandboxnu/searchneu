import React, { ReactElement } from 'react';
import Modal from '../Modal';
import X from '../icons/X.svg';
import Boston from '../icons/boston.svg';

interface NewSubscriptionsLimitModalProps {
  visible: boolean;
  onCancel: () => void;
}

export default function NewSubscriptionsLimitModal({
  visible,
  onCancel,
}: NewSubscriptionsLimitModalProps): ReactElement {
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
          <Boston />
          <span className="phone-modal__header">Unable to turn on notifs?</span>

          <span className="phone-modal__label">
            Users are limited to 12 notifications at a time. Please unsubscribe
            from a class to turn on other notifications.
          </span>
        </div>
      </div>
    </Modal>
  );
}
