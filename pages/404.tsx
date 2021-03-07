import { ReactElement } from 'react';
import Link from 'next/link';
import Four04 from '../components/icons/404.svg';

export default function NotFoundPage(): ReactElement {
  return (
    <div className="four04-container">
      <div className="four04-title-text">something's borked</div>
      <Four04 />
      <Link href="/">
        <div className="four04-return-button">BACK TO HOME</div>
      </Link>
    </div>
  );
}
