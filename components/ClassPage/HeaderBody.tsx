import React, { ReactElement } from 'react';

type HeaderBodyProps = {
  header: string | ReactElement;
  body: ReactElement | ReactElement[];
  className?: string;
};

export default function HeaderBody({
  header,
  body,
  className,
}: HeaderBodyProps): ReactElement {
  return (
    <div className={`headerBodyGroup ${className ? className : ''}`}>
      <h4 className="classPageHeader">{header}</h4>
      {body}
    </div>
  );
}
