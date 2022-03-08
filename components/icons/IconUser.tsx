import React, { ReactElement } from 'react';

const IconUser = ({
  width = '28',
  height = '28',
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
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="14" cy="14" r="13" stroke="#A8DADC" strokeWidth="2" />
    <path
      d="M18.5999 12.6C18.5999 15.1405 16.5404 17.2 13.9999 17.2C11.4594 17.2 9.3999 15.1405 9.3999 12.6C9.3999 10.0595 11.4594 8 13.9999 8C16.5404 8 18.5999 10.0595 18.5999 12.6Z"
      stroke="#A8DADC"
      strokeWidth="2"
    />
    <path
      d="M10.5001 16.1001C9.1001 16.5668 6.1601 18.9001 5.6001 24.5001M22.4001 24.5001C22.4001 22.6334 21.4201 17.7801 17.5001 16.1001"
      stroke="#A8DADC"
      strokeWidth="2"
    />
  </svg>
);

export default IconUser;
