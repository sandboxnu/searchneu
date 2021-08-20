import { Button, Input, Modal, Typography } from 'antd';
import axios from 'axios';
import React, { ReactElement, useState } from 'react';
import { BarLoader } from 'react-spinners';

interface PhoneModalProps {
  visible: boolean;
  onCancel: () => void;
  onSignIn: (token: string) => void;
  onSuccess: () => void;
}

export function PhoneModal({
  visible,
  onCancel,
  onSignIn,
  onSuccess,
}: PhoneModalProps): ReactElement {
  const [countryCode, setCountryCode] = useState('1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneValidationMessage, setPhoneValidationMessage] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const onPhoneNumberSubmit = (): void => {
    axios
      .post(`http://localhost:8080/sms/signup`, {
        phoneNumber: `+${countryCode}${phoneNumber}`,
      })
      .then(() => {
        setPhoneValidationMessage('');
        if (!submitted) setSubmitted(true);
        setResendDisabled(true);
        setTimeout(() => setResendDisabled(false), 30 * 1000);
      })
      .catch((error) => {
        setPhoneValidationMessage(
          'Unable to send text, please check that your phone number is formatted correctly'
        );
      });
  };

  const onVerificationCodeSubmit = (): void => {
    setLoading(true);
    setResponseMessage('');
    axios
      .post(`http://localhost:8080/sms/verify`, {
        phoneNumber: `+${countryCode}${phoneNumber}`,
        verificationCode,
      })
      .then(({ status, data }) => {
        setLoading(false);
        onSignIn(data.token);
        onSuccess();
      })
      .catch((error) => {
        setLoading(false);
        setResendDisabled(false);
        setResponseMessage(
          'Error: Please try again or request a new verification code.'
        );
      });
  };

  const onCountryCodeChange = (value: any): void => {
    const reg = /^\d*$/;
    if (!isNaN(value) && reg.test(value)) {
      setCountryCode(value);
    }
  };

  const onPhoneChange = (value: any): void => {
    const reg = /^\d*$/;
    if (!isNaN(value) && reg.test(value)) {
      setPhoneNumber(value);
    }
  };

  const onVerificationCodeChange = (value: any): void => {
    const reg = /^\d*$/;
    if (!isNaN(value) && reg.test(value)) {
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
          value={countryCode}
          onChange={({ target }) => onCountryCodeChange(target.value)}
        />
        <Input
          style={{ width: '85%' }}
          placeholder="1234567890"
          maxLength={10}
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
