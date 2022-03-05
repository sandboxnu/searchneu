import React, { ReactElement } from 'react';

const IconMessage = ({
  width = '25',
  height = '23',
  className,
}: {
  width?: string;
  height?: string;
  className?: string;
}): ReactElement => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 25 23"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.8462 1C6.51042 1 4.15385 7.66667 4.15385 11C4.15385 13.2222 4.69231 14.3333 5.23077 15.4444L2 21L9 19.8889C11.1538 21 13.3077 21 13.8462 20.9999C21.6 20.9999 23.5385 14.3333 23.5385 11C23.5385 7.34978 20.8462 1 13.8462 1Z"
      stroke="#A8DADC"
      strokeWidth="1.53846"
    />
  </svg>
);

export default IconMessage;
