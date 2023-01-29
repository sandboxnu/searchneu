import React, { ReactElement, useState } from 'react';
import Boston from '../components/icons/boston.svg';
import FooterFeedbackModal from '../components/FeedbackModal';
import CryingHusky from '../components/icons/crying-husky.svg';
import HuskyDollar from '../components/icons/husky-dollar.svg';

/**
 * Page to indicate the api is down.
 */
export default function ApiErrorPage(): ReactElement {
  const containerClassnames = 'home-container';

  const [modalOpen, setModalOpen] = useState(false);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  return (
    <div>
      <div className={containerClassnames}>
        <div // TODO: Take this out and restyle this monstrosity from scratch
          className="ui center spacing aligned icon header topHeader"
        >
          <div className="down-text-container">
            <div className="down-title-text">Oh man!</div>
            <div className="down-sub-title-text">Something went wrong...</div>
            <div className="down-text">{"Don't worry, we're on it"}</div>
            <div>
              <h3> An Error Occurred : </h3>
              <a role="button" onClick={toggleModal}>
                Report a bug
              </a>
            </div>
          </div>

          <HuskyDollar className="huskyDollar" aria-label="logo" />
          <CryingHusky className="cryingHusky" aria-label="logo" />
          <div className="bostonContainer">
            <Boston className="boston" aria-label="logo" />
          </div>
        </div>
      </div>
      <FooterFeedbackModal
        toggleForm={toggleModal}
        feedbackModalOpen={modalOpen}
      />
    </div>
  );
}
