import React, { ReactElement, useEffect } from 'react';
import Tooltip, { TooltipDirection } from '../../Tooltip';

interface VerificationCodeProps {
  onBack: () => void;
  onResend: () => void;
  verificationCode: string;
  setVerificationCode: React.Dispatch<React.SetStateAction<string>>;
  isDisabled: boolean;
  disabledMessage?: string;
  phoneNumber: string;
  codeLength: number;
  error?: string;
}

export default function VerificationCode({
  onBack,
  onResend,
  verificationCode,
  setVerificationCode,
  isDisabled,
  phoneNumber,
  codeLength,
  error,
  disabledMessage,
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
        <span className="phone-modal__header phone-modal__header--verification">
          <span>We sent a verification code to</span>
          <br />
          <span>
            {phoneNumber}, please <b>enter</b> your verification code in the
            next 10 minutes.
          </span>
        </span>
        {error && <span className="phone-modal__error">{error}</span>}
        <div className="phone-modal__verification">
          {[...Array(codeLength)].map((_, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              className="phone-modal__verification-input"
              maxLength={1}
              placeholder={'#'}
              value={verificationCode[index] || ''}
              onChange={onChange}
              onKeyDown={onKeyDown}
            />
          ))}
        </div>
      </div>
      <div className="phone-modal__footer phone-modal__footer--links">
        <span className="phone-modal__link" onClick={onBack}>
          back
        </span>
        <span
          className={`phone-modal__link ${isDisabled && '--disabled'}`}
          onClick={resendVerificationCode}
        >
          {isDisabled ? disabledMessage || '' : 'resend code'}
        </span>
      </div>
    </>
  );
}
