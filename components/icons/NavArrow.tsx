import React, { ReactElement } from 'react';

export const LeftNavArrow = ({
  width = '9',
  height = '20',
  fill = '#000000',
  className,
}: {
  width?: string;
  height?: string;
  fill?: string;
  className?: string;
}): ReactElement => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 9 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0.292893 7.29289C-0.097631 7.68342 -0.097631 8.31658 0.292893 8.70711L6.65685 15.0711C7.04738 15.4616 7.68054 15.4616 8.07107 15.0711C8.46159 14.6805 8.46159 14.0474 8.07107 13.6569L2.41421 8L8.07107 2.34315C8.46159 1.95262 8.46159 1.31946 8.07107 0.928932C7.68054 0.538408 7.04738 0.538408 6.65685 0.928932L0.292893 7.29289ZM2 7H1L1 9H2L2 7Z"
      fill={fill}
    />
  </svg>
);

export const RightNavArrow = ({
  width = '9',
  height = '20',
  fill = '#000000',
  className,
}: {
  width?: string;
  height?: string;
  fill?: string;
  className?: string;
}): ReactElement => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 9 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.70711 8.70711C9.09763 8.31658 9.09763 7.68342 8.70711 7.29289L2.34315 0.928932C1.95262 0.538408 1.31946 0.538408 0.928932 0.928932C0.538408 1.31946 0.538408 1.95262 0.928932 2.34315L6.58579 8L0.928932 13.6569C0.538408 14.0474 0.538408 14.6805 0.928932 15.0711C1.31946 15.4616 1.95262 15.4616 2.34315 15.0711L8.70711 8.70711ZM7 9H8V7H7V9Z"
      fill={fill}
    />
  </svg>
);
