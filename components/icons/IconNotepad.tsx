import React, { ReactElement } from 'react';

const IconNotepad = ({
  width = '17',
  height = '24',
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
    viewBox="0 0 17 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.3333 23H1.50004C1.22389 23 1.00004 22.7761 1.00004 22.5L1 1.5C1 1.22386 1.22386 1 1.5 1H15.5C15.7761 1 16 1.22386 16 1.5V20.25M13.3333 23L16 20.25M13.3333 23V20.75C13.3333 20.4739 13.5572 20.25 13.8333 20.25H16"
      stroke="#E63946"
    />
    <line x1="3" y1="5.3125" x2="14.3334" y2="5.3125" stroke="#E63946" />
    <line x1="3" y1="7.375" x2="14.3334" y2="7.375" stroke="#E63946" />
    <line x1="3" y1="9.4375" x2="14.3334" y2="9.4375" stroke="#E63946" />
    <line x1="3" y1="11.5" x2="14.3334" y2="11.5" stroke="#E63946" />
    <line x1="3" y1="13.5625" x2="14.3334" y2="13.5625" stroke="#E63946" />
    <line x1="3" y1="15.625" x2="14.3334" y2="15.625" stroke="#E63946" />
    <line x1="3" y1="17.6875" x2="14.3334" y2="17.6875" stroke="#E63946" />
  </svg>
);

export default IconNotepad;
