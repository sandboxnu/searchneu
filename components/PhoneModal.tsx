import axios from 'axios';
import React, { ReactElement, useState } from 'react';
import macros from './macros';
import Modal from './Modal';

import PhoneInput from 'react-phone-number-input';

interface PhoneModalProps {
  visible: boolean;
  onCancel: () => void;
  onSignIn: (token: string) => void;
  onSuccess: () => void;
}

const PHONEREG = /^\d*$/;

export function PhoneModal({
  visible,
  onCancel,
  onSignIn,
  onSuccess,
}: PhoneModalProps): ReactElement {
  const [countryCode, setCountryCode] = useState('1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneValidationMessage, setPhoneValidationMessage] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const onPhoneNumberSubmit = (): void => {
    axios
      .post(`${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/sms/signup`, {
        phoneNumber: `+${countryCode}${phoneNumber.split('-').join('')}`,
      })
      .then(() => {
        setPhoneValidationMessage('');
        if (!submitted) setSubmitted(true);
        setResendDisabled(true);
        setTimeout(() => setResendDisabled(false), 30 * 1000);
      })
      .catch((error) => {
        macros.error(error);
        macros.logAmplitudeEvent('Phone Number Failed', { error });
        setPhoneValidationMessage(
          'Unable to send text, please check that your phone number is formatted correctly'
        );
      });
  };

  const onVerificationCodeSubmit = (): void => {
    setLoading(true);
    setResponseMessage('');
    axios
      .post(`${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/sms/verify`, {
        phoneNumber: `+${countryCode}${phoneNumber.split('-').join('')}`,
        verificationCode,
      })
      .then(({ data }) => {
        setLoading(false);
        onSignIn(data.token);
        onSuccess();
      })
      .catch((error) => {
        macros.logAmplitudeEvent('Phone Number Verification Code Failed', {
          error,
        });
        macros.error(error);
        setLoading(false);
        setResendDisabled(false);
        setResponseMessage(
          'Error: Please try again or request a new verification code.'
        );
      });
  };

  const onCountryCodeChange = (value: string): void => {
    if (PHONEREG.test(value)) {
      setCountryCode(value);
    }
    value.length > 0 && phoneNumber.length === 12
      ? setResendDisabled(false)
      : setResendDisabled(true); // checks if the full phone number is valid format
  };

  // Allows users to only input numbers, the code is inserting the dashes into the phone number.
  const onPhoneChange = (value: string): void => {
    const val = value.split('-').join('');
    if (PHONEREG.test(val)) {
      // If the value is not empty, put in the dashes in the phone number so far.
      if (val.length > 0 && val.length < 9) {
        value = val.match(/.{1,3}/g).join('-');
      }
      setPhoneNumber(value);
      countryCode.length > 0 && value.length === 12
        ? setResendDisabled(false)
        : setResendDisabled(true); // checks if the full phone number is valid format
    }
  };

  const onVerificationCodeChange = (value: string): void => {
    if (PHONEREG.test(value)) {
      setVerificationCode(value);
    }
  };

  return (
    <Modal visible={visible} onCancel={onCancel}>
      <div className="phone-modal">
        <div className="phone-modal__body">
          <span className="phone-modal__header">
            Sign up for SMS Notifications
          </span>
          <div className="phone-modal__input-group --mb-1">
            <PhoneInput
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={setPhoneNumber}
            />
            <div className="phone-modal__input-box phone-modal__input-box--country-code">
              <select
                id="countryCodeInput"
                onChange={({ target }) => onCountryCodeChange(target.value)}
                className="phone-modal__input phone-modal__input--country-code"
              ></select>
            </div>
            <div className="phone-modal__input-box phone-modal__input-box--phone">
              <input
                placeholder={'(123)-456-7890'}
                maxLength={12}
                value={phoneNumber}
                onChange={({ target }) => onPhoneChange(target.value)}
                className="phone-modal__input phone-modal__input--phone"
              />
            </div>
          </div>
          <span className="phone-modal__label">
            We will not share your phone number, it will be used for messaging
            about class openings only.
          </span>
        </div>
        <div className="phone-modal__footer">
          <div className="phone-modal__input-group">
            <button
              key="cancel"
              onClick={onCancel}
              className="phone-modal__btn"
            >
              Cancel
            </button>
            <button
              key="ok"
              onClick={onVerificationCodeSubmit}
              className="phone-modal__btn phone-modal__btn--primary"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
  /*
  <Modal
    className='modal'
    visible={visible}
    title="Sign up for SMS notifications"
    onCancel={onCancel}
    footer={<Input.Group compact className="footer-input-group">
      <Button
        key="send code"
        onClick={onPhoneNumberSubmit}
        disabled={resendDisabled}
        className='button'
      >
        Cancel
      </Button>
      <Button
        key="enter code"
        type="primary"
        onClick={onVerificationCodeSubmit}
        disabled={!submitted}
        className='button'
      >
        Ok
      </Button>
    </Input.Group>}
  >
    <br />
    <Input.Group compact className="input-group">
      <Input
        prefix="+"
        maxLength={3}
        value={countryCode}
        onChange={({ target }) => onCountryCodeChange(target.value)}
        className='input'
      />
      <Input
        placeholder={'(123)-456-7890'}
        maxLength={12}
        value={phoneNumber}
        onChange={({ target }) => onPhoneChange(target.value)}
        className='input phone-input'
      />
    </Input.Group>
    <span className='warning'>We will not share your phone number, it will be used for messaging about class openings only. </span>
    {phoneValidationMessage && (
      <span style={{ color: 'red' }}>{phoneValidationMessage}</span>
    )}
    {submitted && (
      <>
        <span>
          Verification code sent to +{countryCode}
          {phoneNumber}
        </span>
        <br />
        <br />
        <span>Enter verification code below:</span>
        <Input
          placeholder="123456"
          maxLength={6}
          value={verificationCode}
          onChange={({ target }) => onVerificationCodeChange(target.value)}
        />
      </>
    )}
    <br />
    <br />
    <BarLoader
      css="display: block"
      loading={loading}
      width={'100%'}
      color={'#E63946'}
    />
    {responseMessage && <span>{responseMessage}</span>}
  </Modal>
  */
}
