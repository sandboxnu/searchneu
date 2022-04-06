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
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendDisabledTimeout, setResendDisabledTimeout] = useState(0);

  // To reset step status and associated message
  useEffect(() => {
    setIsLoading(false);
    setStatusMessage('');
  }, [step, visible, phoneNumber, verificationCode]);

  // To handle submission of verification code
  useEffect(() => {
    if (verificationCode.length === VERIFICATION_CODE_LENGTH) {
      onVerificationCodeSubmit();
    }
  }, [verificationCode]);

  // useEffect pattern used for countdown as per:
  // https://blog.greenroots.info/how-to-create-a-countdown-timer-using-react-hooks
  useEffect(() => {
    if (resendDisabled) {
      const interval = setInterval(
        () => setResendDisabledTimeout(resendDisabledTimeout - 1),
        1000
      );

      if (resendDisabledTimeout <= 0) {
        clearInterval(interval);
        setResendDisabled(false);
      }

      return () => clearInterval(interval);
    }
  }, [resendDisabledTimeout]);

  const onPhoneNumberSubmit = (): void => {
    if (isValidPhoneNumber(phoneNumber)) {
      setIsLoading(true);
      axios
        .post(`${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/sms/signup`, {
          phoneNumber: phoneNumber,
        })
        .then(() => {
          setResendDisabled(true);
          setResendDisabledTimeout(30);
          setStep(Step.VerificationCode);
        })
        .catch((error) => {
          macros.error(error);
          macros.logAmplitudeEvent('Phone Number Failed', {
            error,
          });
          setStatusMessage('error - failed to register');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setStatusMessage('Not a valid phone number');
    }
  };

  const onVerificationCodeSubmit = (): void => {
    setIsLoading(true);
    axios
      .post(`${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/sms/verify`, {
        phoneNumber: phoneNumber,
        verificationCode: verificationCode,
      })
      .then(({ data }) => {
        onSignIn(data.token);
        onSuccess();
      })
      .catch((error) => {
        macros.error(error);
        macros.logAmplitudeEvent('Phone Number Verification Code Failed', {
          error,
        });
        setStatusMessage('error - incorrect code');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Modal visible={visible} onCancel={onCancel}>
      <div className="phone-modal">
        {isLoading && (
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
                  disabledMessage={`resend in ${resendDisabledTimeout} seconds`}
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
