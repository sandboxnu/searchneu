import { ReactElement } from 'react';
import Toast from '../Toast';
import CryingHusky3 from '../icons/crying-husky-3.svg';

const TestimonialMessage: ReactElement = (
  <>
    We need your help!{' '}
    <a
      href="https://docs.google.com/forms/d/e/1FAIpQLSdOWqfXW4KJZNbHI9hbQohfsY9BIJnxLSuUz8p_DIx4bZkZ9A/viewform"
      target="_blank"
      rel="noreferrer"
    >
      Leave a testimonial
    </a>
  </>
);

export default function TestimonialToast(): ReactElement {
  return (
    <Toast
      message={TestimonialMessage}
      image={<CryingHusky3 width={24} height={24} />}
      infiniteLength={true}
    />
  );
}
