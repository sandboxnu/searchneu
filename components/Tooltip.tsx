import React from 'react';

export enum TooltipDirection {
  Up = 'UP',
  Down = 'DOWN',
}

type TooltipProps = {
  text: string;
  direction: TooltipDirection;
};

export default function Tooltip({ text, direction }: TooltipProps) {
  return (
    <div className={'tooltip'}>
      {text}
      <div className={`tooltip__arrow--${direction}`} />
    </div>
  );
}
