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
          <span className="phone-modal__header">Notifications are up!</span>

          <span className="phone-modal__label">
            We{`'`}re limiting users to 12 subscriptions at a time to keep
            SearchNEU running for our growing NEU community.
          </span>
        </div>
      </div>
    </Modal>
  );
}
