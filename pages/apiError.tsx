import React, { ReactElement, useState } from 'react';
import Boston from '../components/icons/boston.svg';
import FooterFeedbackModal from '../components/FeedbackModal';
import Husky from '../components/icons/Husky';
import { Campus } from '../components/types';
import Image from 'next/image';

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
    <>
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
            <div // TODO: Take this out and restyle this monstrosity from scratch
              className="ui center spacing aligned icon header topHeader"
            >
              <div className="centerTextContainer">
                <div className="api-error-title-text">Oh man!</div>
                <div className="api-error-sub-title-text">
                  Something went wrong...
                </div>
                <div>
                  <div className="api-error-text">
                    {"Don't worry, we're on it"}
                  </div>
                  <button
                    type="button"
                    className="suport-button"
                    onClick={toggleModal}
                  >
                    SEND SUPPORT REQUEST
                  </button>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className="create-issue"
                    href="https://github.com/sandboxnu/searchneu"
                  >
                    &nbsp;Create issue on GitHub
                  </a>
                </div>
              </div>

              <Husky className="husky" campus={Campus.NEU} aria-label="husky" />
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
    </>
  );
}
