import 'react-phone-number-input/style.css';
import React, { ReactElement } from 'react';
import X from '../../icons/X.svg';
import OneMoreStep from '../../icons/one-more-step.svg';

interface GoSignInProps {
  onCancel: () => void;
  onSubmit: () => void;
}

export default function GoSignIn({
  onCancel,
  onSubmit,
}: GoSignInProps): ReactElement {
  return (
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
        <OneMoreStep />
        <span className="phone-modal__header">One more step...</span>

        <span className="phone-modal__label">
          Sign in with your phone number to be the first to know when seats open
          up.
        </span>

        <div className="phone-modal__button-container">
          <button
            key="ok"
            onClick={onSubmit}
            className="phone-modal__btn phone-modal__btn--primary"
          >
            Sign in
          </button>
        </div>
      </div>
    </>
  );
}
