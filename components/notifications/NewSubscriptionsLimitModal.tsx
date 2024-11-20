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
          <span className="phone-modal__header">Notifications Update</span>

          <span className="phone-modal__label">
            Users can now properly subscribe/unsubscribe to up to 12
            notifications for Spring 2025. Previous semester notifs are no
            longer counted towards this limit.
          </span>
          <br />
          <span className="phone-modal__label">
            We are working on a way for users to view all their subscriptions
            and are updating our display of professor data on courses.
          </span>
          <br />
          <span className="phone-modal__label">
            We are very sorry about the inconvenience these issues cause, and
            will deploy more fixes ASAP. Thank you!
          </span>
          <br />
        </div>
      </div>
    </Modal>
  );
}
