import React, { ReactElement } from 'react';
import Modal from '../Modal';
import X from '../icons/X.svg';
import CryingHusky3 from '../icons/crying-husky-3.svg';

interface DisabledNotificationsModalProps {
  visible: boolean;
  onCancel: () => void;
}

export default function DisabledNotificationsModal({
  visible,
  onCancel,
}: DisabledNotificationsModalProps): ReactElement {
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
          <span className="phone-modal__header">Notifications have paused for the summer</span>

          <span className="phone-modal__label">
            Due to cost issues, we{`'`}re putting notifications on pause until we acquire additional funding in the fall.
          </span>        
        </div>
      </div>
    </Modal>
  );
}
