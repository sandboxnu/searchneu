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
import GoSignIn from './GoSignIn';
import VerificationCode from './VerificationCode';
import Colors from '../../../styles/_exports.module.scss';

const VERIFICATION_CODE_LENGTH = 6;

interface SignUpModalProps {
  visible: boolean;
  onCancel: () => void;
  onSignIn: (token: string) => void;
  onSuccess: () => void;
  oneMoreStep?: boolean;
}

/**
 * A step in the sign-up process associated with a modal screen.
 */
enum Step {
  GoSignIn,
  PhoneNumber,
  VerificationCode,
}

export default function SignUpModal({
  visible,
  onCancel,
  onSignIn,
  onSuccess,
  oneMoreStep = false,
}: SignUpModalProps): ReactElement {
  const [step, setStep] = useState<Step>(
    oneMoreStep ? Step.GoSignIn : Step.PhoneNumber
  );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          setStatusMessage('Invalid phone number');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setStatusMessage('Incorrect code entered');
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
        if (oneMoreStep) {
          setStep(Step.GoSignIn);
        }
        setVerificationCode('');
        onSuccess();
      })
      .catch((error) => {
        macros.error(error);
        macros.logAmplitudeEvent('Phone Number Verification Code Failed', {
          error,
        });
        setStatusMessage('Incorrect code entered');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleCancel = (): void => {
    if (oneMoreStep) {
      setStep(Step.GoSignIn);
    }
    onCancel();
  };

  return (
    <Modal visible={visible} onCancel={handleCancel}>
      <div className="phone-modal">
        {isLoading && (
          <div className="phone-modal__spinner">
            <MoonLoader color={Colors.aqua} loading={true} size={32} />
          </div>
        )}
        {(() => {
          switch (step) {
            case Step.GoSignIn:
              return (
                <GoSignIn
                  onCancel={handleCancel}
                  onSubmit={() => setStep(Step.PhoneNumber)}
                />
              );
            case Step.PhoneNumber:
              return (
                <PhoneNumber
                  setPhoneNumber={setPhoneNumber}
                  onCancel={handleCancel}
                  onSubmit={onPhoneNumberSubmit}
                  error={statusMessage}
                />
              );
            case Step.VerificationCode:
              return (
                <VerificationCode
                  onBack={() => {
                    setPhoneNumber('');
                    setStep(Step.PhoneNumber);
                  }}
                  onCancel={handleCancel}
                  onResend={onPhoneNumberSubmit}
                  verificationCode={verificationCode}
                  setVerificationCode={setVerificationCode}
                  onVerificationCodeSubmit={onVerificationCodeSubmit}
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
