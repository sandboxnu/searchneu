import { Markup } from 'interweave';
import { mean } from 'lodash';
import React, { ReactElement, useState } from 'react';
import { useRouter } from 'next/router';
import IconCollapseExpand from '../../icons/IconCollapseExpand';
import { PageContentProps } from '../PageContent';
import { getLastUpdateString } from '../../common/LastUpdated';
import {
  creditsDescription,
  creditsNumericDisplay,
} from '../../common/CreditsDisplay';
import { Campus } from '../../types';
import IconGradcap from '../../icons/IconGradcap';
import IconScale from '../../icons/IconScale';
import IconTie from '../../icons/IconTie';
import IconDollarSign from '../../icons/IconDollarSign';
import {
  numberOfSections,
  seatsAvailable,
  seatsFilled,
} from '../ClassPageInfoBody';
import Expandable from './MobileClassInfoExpandable';
import IconGlobe from '../../icons/IconGlobe';
import IconMessage from '../../icons/IconMessage';
import SignUpForNotifications from '../../SignUpForNotifications';

export default function MobilePageContent({
  termId,
  campus,
  subject,
  classId,
  classPageInfo,
  isCoreq,
}: PageContentProps): ReactElement {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [showingMore, setShowMore] = useState(false);

  return (
    <div className="mobilePageContent">
      <div className="backToResults" onClick={() => router.back()}>
        {'< Back to Search Results'}
      </div>

      {classPageInfo && classPageInfo.class && (
        <div className="classPageContainer">
          <div
            className={
              expanded
                ? 'classPageContainer__header--expanded'
                : 'classPageContainer__header'
            }
            role="button"
            tabIndex={0}
            onClick={() => setExpanded(!expanded)}
          >
            <IconCollapseExpand />
            <span className="classPageContainer__header--classTitle">
              {`${subject}${classId}: ${classPageInfo.class.name}`}
            </span>
          </div>

          {expanded && (
            <div className="classPageContainer__panel">
              <div className="updateCreditPanel">
                <div className="lastUpdated">
                  {`Updated ${getLastUpdateString(
                    classPageInfo.class.latestOccurrence.lastUpdateTime
                  )}`}
                </div>
                <div className="creditsDisplay">
                  <span className="creditsNumericDisplay">
                    {creditsNumericDisplay(
                      classPageInfo.class.latestOccurrence.maxCredits,
                      classPageInfo.class.latestOccurrence.minCredits
                    )}
                  </span>
                  {classPageInfo.class.latestOccurrence.maxCredits === 1
                    ? ' Credit'
                    : ' Credits'}
                </div>
              </div>

              <div
                className={
                  showingMore
                    ? 'classPageContainer__panel--description'
                    : 'classPageContainer__panel--descriptionHidden'
                }
              >
                <Markup content={classPageInfo.class.latestOccurrence.desc} />
              </div>
              <div
                className="classPageContainer__panel--showMore"
                role="button"
                tabIndex={0}
                onClick={() => setShowMore(!showingMore)}
              >
                {showingMore ? 'Show less' : 'Show more'}
              </div>

              <div className="courseLevel">
                {campus === Campus.NEU ? (
                  <IconGradcap />
                ) : campus === Campus.CPS ? (
                  <IconTie />
                ) : (
                  <IconScale />
                )}
                <span className="courseLevelText">
                  {campus === Campus.NEU &&
                    `${
                      parseInt(classId) < 5000 ? 'Undergraduate' : 'Graduate'
                    } Course Level`}
                  {campus === Campus.CPS && 'College of Professional Studies'}
                  {campus == Campus.LAW && 'School of Law'}
                </span>
              </div>

              {classPageInfo.class.latestOccurrence.feeAmount && (
                <div className="courseFees">
                  <IconDollarSign />
                  <span className="courseFeesText">
                    {`Course Fees: $${classPageInfo.class.latestOccurrence.feeAmount.toLocaleString()}`}
                  </span>
                </div>
              )}

              <div className="avgInfo">
                <p>In this course, there are, on average:</p>
                <ul>
                  <li>
                    <b>{Math.round(mean(numberOfSections(classPageInfo)))}</b>{' '}
                    sections
                  </li>
                  <li>
                    <b>{Math.round(mean(seatsAvailable(classPageInfo)))}</b>{' '}
                    seats per section
                  </li>
                  <li>
                    <b>{Math.round(mean(seatsFilled(classPageInfo)))}</b> seats
                    filled, or{' '}
                    <b>
                      {(
                        (Math.round(mean(seatsFilled(classPageInfo))) /
                          Math.round(mean(seatsAvailable(classPageInfo)))) *
                        100
                      ).toFixed(1)}
                      %
                    </b>{' '}
                    of seats per section filled.
                  </li>
                </ul>
              </div>

              <div className="expandables">
                <Expandable
                  title="RECENT PROFESSORS"
                  classPageInfo={classPageInfo}
                />
                <Expandable
                  title="RECENT SEMESTERS OFFERED"
                  classPageInfo={classPageInfo}
                />
                <Expandable title="NUPATHS" classPageInfo={classPageInfo} />
                <Expandable
                  title="PREREQUISITES"
                  classPageInfo={classPageInfo}
                />
                <Expandable
                  title="COREQUISITES"
                  classPageInfo={classPageInfo}
                />
                <Expandable
                  title="PREREQUISITE FOR"
                  classPageInfo={classPageInfo}
                />
                <Expandable
                  title="OPTIONAL PREREQUISITE FOR"
                  classPageInfo={classPageInfo}
                />
              </div>

              <div className="bannerButton">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={classPageInfo.class.latestOccurrence.prettyUrl}
                  className="bannerPageLink"
                >
                  <IconGlobe width="22" height="22" className="globe-icon" />
                  <span>View the course on Banner</span>
                </a>
              </div>

              <div className="notifyButton">
                {/* <SignUpForNotifications
                  course={classPageInfo.class.latestOccurrence}
                  userInfo={userInfo}
                  onSignIn={onSignIn}
                  showNotificationSignup={false}
                  fetchUserInfo={fetchUserInfo}
                /> */}
                <IconMessage className="message-icon" />
                <span>Notify me when seats open!</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
