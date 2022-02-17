import React, { ReactElement } from 'react';

const IconMessage = ({
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
    viewBox="0 0 16 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.72295 1C3.95472 1 2.42295 5.33333 2.42295 7.5C2.42295 8.94444 2.77295 9.66667 3.12295 10.3889L1.02295 14L5.57295 13.2778C6.97295 14 8.37295 14 8.72295 14C13.7629 14 15.0229 9.66667 15.0229 7.5C15.0229 5.12736 13.2729 1 8.72295 1Z"
      stroke="#A8DADC"
    />
  </svg>
);

export default IconMessage;
