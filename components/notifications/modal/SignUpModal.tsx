import 'react-phone-number-input/style.css';
import {
  isValidPhoneNumber,
  formatPhoneNumberIntl,
} from 'react-phone-number-input';
import { MoonLoader } from 'react-spinners';
import axios from 'axios';
import React, { ReactElement, useEffect, useState } from 'react';
import macros from '../../macros';
import Modal from '../../Modal';
import PhoneNumber from './PhoneNumber';
import VerificationCode from './VerificationCode';

const VERIFICATION_CODE_LENGTH = 6;

interface SignUpModalProps {
  visible: boolean;
  onCancel: () => void;
  onSignIn: (token: string) => void;
  onSuccess: () => void;
}

/**
 * A verification request status state.
 */
enum Status {
  Pending,
  Loading,
  Failed,
  Succeeded,
}

/**
 * A step in the sign-up process associated with a modal screen.
 */
enum Step {
  PhoneNumber,
  VerificationCode,
}

export default function SignUpModal({
  visible,
  onCancel,
  onSignIn,
  onSuccess,
}: SignUpModalProps): ReactElement {
  const [step, setStep] = useState<Step>(Step.PhoneNumber);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [status, setStatus] = useState<Status>(Status.Pending);
  const [statusMessage, setStatusMessage] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);

  // To reset step status and associated message
  useEffect(() => {
    setStatus(Status.Pending);
    setStatusMessage('');
  }, [step, visible, phoneNumber, verificationCode]);

  // To handle submission of verification code
  useEffect(() => {
    if (verificationCode.length === VERIFICATION_CODE_LENGTH) {
      onVerificationCodeSubmit();
    }
  }, [verificationCode]);

  const onPhoneNumberSubmit = (): void => {
    if (isValidPhoneNumber(phoneNumber)) {
      setStatus(Status.Loading);
      axios
        .post(`${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/sms/signup`, {
          phoneNumber: phoneNumber,
        })
        .then(() => {
          setStatus(Status.Succeeded);
          setResendDisabled(true);
          setTimeout(() => setResendDisabled(false), 30 * 1000);
          setStep(Step.VerificationCode);
        })
        .catch((error) => {
          macros.error(error);
          macros.logAmplitudeEvent('Phone Number Failed', {
            error,
          });
          setStatus(Status.Failed);
          setStatusMessage('error - failed to register');
        });
    } else {
      setStatus(Status.Failed);
      setStatusMessage('Not a valid phone number');
    }
  };

  const onVerificationCodeSubmit = (): void => {
    setStatus(Status.Loading);
    axios
      .post(`${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/sms/verify`, {
        phoneNumber: phoneNumber,
        verificationCode: verificationCode,
      })
      .then(({ data }) => {
        onSignIn(data.token);
        setStatus(Status.Succeeded);
        onSuccess();
      })
      .catch((error) => {
        macros.error(error);
        macros.logAmplitudeEvent('Phone Number Verification Code Failed', {
          error,
        });
        setResendDisabled(false);
        setStatus(Status.Failed);
        setStatusMessage('error - incorrect code');
      });
  };

  return (
    <Modal visible={visible} onCancel={onCancel}>
      <div className="phone-modal">
        {status === Status.Loading && (
          <div className="phone-modal__spinner">
            <MoonLoader color={'#7fc4c7'} loading={true} size={32} />
          </div>
        )}
        {(() => {
          switch (step) {
            case Step.PhoneNumber:
              return (
                <PhoneNumber
                  setPhoneNumber={setPhoneNumber}
                  onCancel={onCancel}
                  onSubmit={onPhoneNumberSubmit}
                  error={statusMessage}
                />
              );
            case Step.VerificationCode:
              return (
                <VerificationCode
                  onBack={() => setStep(Step.PhoneNumber)}
                  onResend={onPhoneNumberSubmit}
                  verificationCode={verificationCode}
                  setVerificationCode={setVerificationCode}
                  isDisabled={resendDisabled}
                  phoneNumber={formatPhoneNumberIntl(phoneNumber)}
                  codeLength={VERIFICATION_CODE_LENGTH}
                  error={statusMessage}
                />
              );
            default:
              return <></>;
          }
        })()}
      </div>
    </Modal>
  );
}
