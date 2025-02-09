import React, { ReactElement } from 'react';
import Modal from '../Modal';
import X from '../icons/X.svg';
import Boston from '../icons/boston.svg';

interface NewSubscriptionsLimitModalProps {
  visible: boolean;
  onCancel: () => void;
}

export default function SubscriptionsPageModal({
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
          <span className="phone-modal__header">Notifications Update</span>

          <span className="phone-modal__label">
            Users can now easily subscribe or unsubscribe through the
            notifications page!
          </span>
          <br />
          <span className="phone-modal__label">
            To view previously subscribed sections, simply click the
            Subscriptions button next to the sign-out option.
          </span>
          <br />
        </div>
      </div>
    </Modal>
  );
}
