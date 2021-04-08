import React from 'react';

type TooltipProps = {
  text: string;
};

export default function Tooltip({ text }: TooltipProps) {
  return <div className="tooltip">{text}</div>;
}
