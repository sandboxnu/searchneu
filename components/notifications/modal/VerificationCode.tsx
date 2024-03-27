import React, { ReactElement, useEffect } from 'react';
import X from '../../icons/X.svg';
import ArrowLeft from '../../icons/arrow-left.svg';
import Colors from '../../../styles/_exports.module.scss';

interface VerificationCodeProps {
  onBack: () => void;
  onResend: () => void;
  onCancel: () => void;
  verificationCode: string;
  setVerificationCode: React.Dispatch<React.SetStateAction<string>>;
  isDisabled: boolean;
  onVerificationCodeSubmit: () => void;
  phoneNumber: string;
  codeLength: number;
  error?: string;
}

export default function VerificationCode({
  onBack,
  onResend,
  onCancel,
  verificationCode,
  setVerificationCode,
  onVerificationCodeSubmit,
  isDisabled,
  phoneNumber,
  codeLength,
  error,
}: VerificationCodeProps): ReactElement {
  const inputRefs = React.useRef<HTMLInputElement[]>([]);

  // To handle input focusing
  useEffect(() => {
    inputRefs.current[verificationCode.length]?.focus();
  }, [verificationCode]);

  const resendVerificationCode = (): void => {
    if (!isDisabled) {
      setVerificationCode('');
      onResend();
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (/[0-9]/.test(event.target.value)) {
      setVerificationCode(verificationCode + event.target.value);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace') {
      setVerificationCode(verificationCode.slice(0, -1)); // Remove last character
    }
  };

  return (
    <>
      <div className="phone-modal__body">
        <div className="phone-modal__action-btns">
          <button
            onClick={onBack}
            className="phone-modal__action-btn phone-modal__action-btn-back"
          >
            <ArrowLeft />
          </button>

          <button
            onClick={onCancel}
            className="phone-modal__action-btn phone-modal__action-btn--x"
          >
            <X />
          </button>
        </div>
        <span className="phone-modal__header">Verify Phone Number</span>

        <span className="phone-modal__label phone-modal__label--verify">
          Enter the code sent to {phoneNumber} to complete sign in.{' '}
          <span
            className="phone-modal__label--resend"
            onClick={resendVerificationCode}
          >
            Resend code
          </span>
        </span>
        <div className="phone-modal__verification">
          {[...Array(codeLength)].map((_, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              className="phone-modal__verification-input"
              style={error ? { borderColor: Colors.neu_red } : {}}
              maxLength={1}
              value={verificationCode[index] || ''}
              onChange={onChange}
              onKeyDown={onKeyDown}
            />
          ))}
        </div>
        {error && <span className="phone-modal__error">{error}</span>}
        <div className="phone-modal__button-container">
          <button
            key="ok"
            onClick={onVerificationCodeSubmit}
            className="phone-modal__btn phone-modal__btn--primary"
          >
            Verify Code
          </button>
        </div>
      </div>
    </>
  );
}
