import React, { ReactElement, useState } from 'react';
import Boston from '../components/icons/boston.svg';
import FooterFeedbackModal from '../components/FeedbackModal';
import CryingHusky2 from '../components/icons/crying-husky-2.svg';
import Image from 'next/image';

/**
 * Page to indicate the api is down.
 */
export default function ApiErrorPage(): ReactElement {
  const containerClassnames = 'home-container';

  const [modalOpen, setModalOpen] = useState(false);

  const toggleModal = () => setModalOpen(!modalOpen);

  return (
    <div>
      <div className={containerClassnames}>
        <a
          href="https://www.sandboxnu.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="sandboxLogoContainer"
        >
          <Image
            src="/images/sandbox-logo.png"
            alt="sandbox logo"
            width={47}
            height={61}
          />
        </a>

        <div>
          <div className="topHeader">
            <div className="error-container">
              <div className="error-text-container centerTextContainer">
                <div className="error-text-container">
                  <div className="api-error-title-text">Oh man!</div>
                  <div className="api-error-sub-title-text">
                    Something went wrong...
                  </div>

                  <div className="api-error-text">
                    {"Don't worry, we're on it"}
                  </div>
                  <div className="request-container">
                    <button
                      type="button"
                      className="support-button"
                      onClick={toggleModal}
                    >
                      SEND SUPPORT REQUEST
                    </button>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      className="create-issue"
                      href="https://github.com/sandboxnu/searchneu/issues/new"
                    >
                      Create issue on GitHub
                    </a>
                  </div>
                </div>
              </div>
              <div className="husky-container">
                <CryingHusky2
                  className="crying-husky-2"
                  aria-label="crying-husky-2"
                />
              </div>
            </div>

            <div className="bostonContainer">
              <Boston className="boston" aria-label="logo" />
            </div>
          </div>

          <FooterFeedbackModal
            toggleForm={toggleModal}
            feedbackModalOpen={modalOpen}
          />
        </div>
      </div>
    </div>
  );
}
