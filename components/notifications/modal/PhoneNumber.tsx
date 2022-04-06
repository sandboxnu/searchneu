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
        <span className="phone-modal__header">
          Sign up for SMS Notifications
        </span>
        <PhoneInput
          className="phone-modal__phone-input"
          placeholder="+1 (123)-456-7890"
          defaultCountry="US"
          onChange={setPhoneNumber}
        />
        {error ? (
          <span className="phone-modal__error">{error}</span>
        ) : (
          <span className="phone-modal__label">
            We will not share your phone number, it will be used for messaging
            about class openings only.
          </span>
        )}
      </div>
      <div className="phone-modal__footer phone-modal__footer--buttons">
        <div className="phone-modal__input-group">
          <button key="cancel" onClick={onCancel} className="phone-modal__btn">
            Cancel
          </button>
          <button
            key="ok"
            onClick={onSubmit}
            className="phone-modal__btn phone-modal__btn--primary"
          >
            OK
          </button>
        </div>
      </div>
    </>
  );
}
