import React, { ReactElement } from 'react';
import Modal from '../Modal';
import X from '../icons/X.svg';
import Boston from '../icons/boston.svg';
import CryingHusky3 from '../icons/crying-husky-3.svg';

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
          <CryingHusky3 />
          <span className="phone-modal__header">Notifications Issues</span>

          <span className="phone-modal__label">
            We found issues with unsubscribing from notifications.
          </span>
          <span className="phone-modal__label">
            We are very sorry about the inconvenience this causes, and are
            working to deploy fixes ASAP. Thank you!
          </span>
        </div>
      </div>
    </Modal>
  );
}
