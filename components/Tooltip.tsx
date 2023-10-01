import React from 'react';

export enum TooltipDirection {
  Up = 'UP',
  Down = 'DOWN',
}

export type TooltipProps = {
  text: string;
  direction: TooltipDirection;
  /**
   * Decides the orientation of the Tooltip box; by default, the orientation has text
   * expanding on the right side. If this variable is set to T, the box will have
   * text expanding the left side, making it "flipped".
   */
  flipLeft?: boolean;
};

export default function Tooltip(props: TooltipProps) {
  return (
    <div className={props.flipLeft ? 'tooltip flip_tooltip' : 'tooltip'}>
      {props.text}
      <div className={`tooltip__arrow--${props.direction}`} />
    </div>
  );
}
