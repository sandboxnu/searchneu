import React, { ReactElement } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  visible: boolean;
  onCancel: () => void;
}

export default function Modal({
  visible,
  onCancel,
  children,
}: React.PropsWithChildren<ModalProps>): ReactElement {
  React.useEffect(() => {
    const handleKeyEvent = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyEvent);

    return () => document.removeEventListener('keydown', handleKeyEvent);
  }, [onCancel]);

  return createPortal(
    <>
      {visible && (
        <div className="modal-wrapper" onClick={onCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
