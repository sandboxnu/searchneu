import { ReactElement } from 'react';
import Toast from '../Toast';
import CryingHusky3 from '../icons/crying-husky-3.svg';

interface TestimonialMessageProps {
  position?: string;
}

const TestimonialMessage: ReactElement = (
  <span className="toast-message">
    We need your help!{' '}
    <a
      className="link"
      href="https://docs.google.com/forms/d/e/1FAIpQLSdOWqfXW4KJZNbHI9hbQohfsY9BIJnxLSuUz8p_DIx4bZkZ9A/viewform"
      target="_blank"
      rel="noreferrer"
    >
      Leave a testimonial
    </a>
  </span>
);

export default function TestimonialToast({
  position = 'toast-bottom-right',
}: TestimonialMessageProps): ReactElement {
  return (
    <Toast
      message={TestimonialMessage}
      position={position}
      image={<CryingHusky3 width={24} height={24} />}
      infiniteLength={true}
    />
  );
}
