import { Markup } from 'interweave';
import React, { ReactElement, useState } from 'react';
import { useRouter } from 'next/router';
import IconCollapseExpand from '../../icons/IconCollapseExpand';
import { PageContentProps } from '../PageContent';
import { getLastUpdateString } from '../../common/LastUpdated';
import {
  creditsDescription,
  creditsNumericDisplay,
} from '../../common/CreditsDisplay';

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
  const [showMore, setShowMore] = useState(false);

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
                  showMore
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
                onClick={() => setShowMore(!showMore)}
              >
                {showMore ? 'Show less' : 'Show more'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
