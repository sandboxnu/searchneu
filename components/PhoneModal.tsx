import { Button, Input, Modal, Typography } from 'antd';
import axios from 'axios';
import React, { ReactElement, useState } from 'react';
import { BarLoader } from 'react-spinners';
import macros from './macros';

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

  // TODO: Use regex check to see if phone number is valid, could be all numbers or dashes and parentheses in the right places. Send message if wrong format, else strip out non-number characters then send to backend.
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
    <Modal
      visible={visible}
      title="Sign up for SMS notifications!"
      onCancel={onCancel}
      footer={[
        <Button
          key="send code"
          onClick={onPhoneNumberSubmit}
          disabled={resendDisabled}
        >
          {submitted ? 'Send New Verification Text' : 'Send Verification Text'}
        </Button>,
        <Button
          key="enter code"
          type="primary"
          onClick={onVerificationCodeSubmit}
          disabled={!submitted}
        >
          Enter Code
        </Button>,
      ]}
    >
      <Typography.Text>Enter your phone #:</Typography.Text>
      <br />
      <Input.Group compact>
        <Input
          style={{ width: '15%' }}
          prefix="+"
          maxLength={3}
          value={countryCode}
          onChange={({ target }) => onCountryCodeChange(target.value)}
        />
        <Input
          style={{ width: '85%' }}
          placeholder={'XXX-XXX-XXXX'}
          maxLength={12}
          value={phoneNumber}
          onChange={({ target }) => onPhoneChange(target.value)}
        />
      </Input.Group>
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
  );
}
