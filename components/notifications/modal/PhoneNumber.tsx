import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import React, { ReactElement } from 'react';

interface PhoneNumberProps {
  setPhoneNumber: React.Dispatch<React.SetStateAction<string>>;
  onCancel: () => void;
  onSubmit: () => void;
  error?: string;
}

export default function PhonNumber({
  setPhoneNumber,
  onCancel,
  onSubmit,
  error,
}: PhoneNumberProps): ReactElement {
  return (
    <>
      <div className="phone-modal__body">
        <span className="phone-modal__header">Sign in for notifications</span>
        {error ? (
          <span className="phone-modal__error">{error}</span>
        ) : (
          <span className="phone-modal__label">
            Your phone number will be used for class notifications and nothing
            else.
          </span>
        )}
        <PhoneInput
          className="phone-modal__phone-input"
          placeholder="+1 (123)-456-7890"
          defaultCountry="US"
          onChange={setPhoneNumber}
        />
        <div className="phone-modal__button-container">
          <button
            key="ok"
            onClick={onSubmit}
            className="phone-modal__btn phone-modal__btn--primary"
          >
            Send Code
          </button>
          <button key="cancel" onClick={onCancel} className="phone-modal__btn ">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
