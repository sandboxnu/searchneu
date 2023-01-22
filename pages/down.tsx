import React, { ReactElement } from 'react';
import Boston from '../components/icons/boston.svg';
import CryingHusky from '../components/icons/crying-husky.svg';
import HuskyDollar from '../components/icons/husky-dollar.svg';

/**
 * Page to indicate the site is down due to AWS migration. During the migration, all "/[campus]/*"
 * paths are temporally redirected to this page.
 */
export default function DownPage(): ReactElement {
  const containerClassnames = 'home-container';
  const text =
    'SearchNEU relies on AWS credits to maintain our infrastructure. ' +
    "Unfortunately, we've run out of credits on our current account. " +
    "Due to how AWS distributes new credits to our organization, we'll have " +
    'to migrate all of our infrastructure to a new AWS account. ' +
    'During the migration process, our service will be unavailable.\n ' +
    'Thanks for your patience!';

  return (
    <div>
      <div className={containerClassnames}>
        <div // TODO: Take this out and restyle this monstrosity from scratch
          className="ui center spacing aligned icon header topHeader"
        >
          <div className="down-text-container">
            <div className="down-title-text">Ran out of Husky Dollars...</div>
            <div className="down-sub-title-text">
              Don’t worry! We should be back in a few hours.
            </div>
            <div className="down-text">{text}</div>
          </div>

          <HuskyDollar className="huskyDollar" aria-label="logo" />
          <CryingHusky className="cryingHusky" aria-label="logo" />
          <div className="bostonContainer">
            <Boston className="boston" aria-label="logo" />
          </div>
        </div>
      </div>
    </div>
  );
}
