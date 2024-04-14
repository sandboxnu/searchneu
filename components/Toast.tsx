import { ReactElement, useEffect, useState } from 'react';
import X from './icons/X.svg';

interface ToastProps {
  message: ReactElement;
  duration?: number;
  infiniteLength?: boolean;
  image?: ReactElement;
  position: string;
}

export default function Toast({
  message,
  duration = 20,
  infiniteLength = false,
  image = null,
  position,
}: ToastProps): ReactElement {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!infiniteLength) {
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [duration, infiniteLength]);
  return isVisible ? (
    <div className={`toast-body ${position}`}>
      {image}
      {message}
      <button
        className="phone-modal__action-btn phone-modal__action-btn--x"
        onClick={() => setIsVisible(false)}
      >
        <X />
      </button>
    </div>
  ) : null;
}
