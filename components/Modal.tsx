import React, { ReactElement } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  visible: boolean;
  onCancel: () => void;
}

export default function Modal(
  props: React.PropsWithChildren<Props>
): ReactElement {
  const { visible, onCancel, children } = props;

  React.useEffect(() => {
    const handleKeyEvent = (event: KeyboardEvent): void => {
      switch (event.key) {
        case 'Escape':
          onCancel();
          break;
        default:
          break;
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
