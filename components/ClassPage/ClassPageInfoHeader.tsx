import React, { ReactElement, useState } from 'react';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import {
  creditsDescription,
  creditsNumericDisplay,
  lowercaseCreditsDescription,
} from '../common/CreditsDisplay';
import { LastUpdated } from '../common/LastUpdated';

type ClassPageInfoHeaderProps = {
  classPageInfo: GetClassPageInfoQuery;
};

export function ClassPageInfoHeader({
  classPageInfo,
}: ClassPageInfoHeaderProps): ReactElement {
  const { subject, name, classId, latestOccurrence } = classPageInfo.class;
  return (
    <div className="classPageInfoHeader">
      <div className="title">
        <div className="titleItems">
          <h1 className="classCode">{`${subject.toUpperCase()}${classId}`}</h1>
          <h2 className="className">{name}</h2>
        </div>
      </div>
      <div className="flex justify-space-between">
        <LastUpdated
          lastUpdateTime={latestOccurrence.lastUpdateTime}
          iconHeight="25"
          iconWidth="24"
          className="classPageLastUpdated"
        />
        <div className="creditsDisplay">
          <span className="creditsNumericDisplay">
            {creditsNumericDisplay(
              latestOccurrence.maxCredits,
              latestOccurrence.minCredits
            )}
          </span>
          <br></br>
          <span className="creditsDescriptionDisplay">
            {creditsDescription(latestOccurrence.maxCredits)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MobileClassPageInfoHeader({
  classPageInfo,
}: ClassPageInfoHeaderProps): ReactElement {
  const [seeMore, setSeeMore] = useState(false);
  const { subject, name, classId, latestOccurrence } = classPageInfo.class;
  return (
    <div className="mobileClassPageInfoHeader">
      <div className="mobileClassPageInfoHeader--rowDouble">
        <span className="mobileClassPageInfoHeader--classTitle">{`${subject.toUpperCase()}${classId}`}</span>
        <span className="mobileClassPageInfoHeader--credits">
          {creditsNumericDisplay(
            latestOccurrence.maxCredits,
            latestOccurrence.minCredits
          )}{' '}
          {lowercaseCreditsDescription(latestOccurrence.maxCredits)}
        </span>
      </div>
      <div className="mobileClassPageInfoHeader--rowDouble">
        <span className="mobileClassPageInfoHeader--className">{name}</span>
        <LastUpdated
          lastUpdateTime={latestOccurrence.lastUpdateTime}
          iconHeight="16"
          iconWidth="16"
          className="mobileClassPageInfoHeader--lastUpdated"
        />
      </div>
      <span className="mobileClassPageInfoHeader--header">
        Course Description
      </span>
      <div
        className={
          seeMore
            ? 'mobileClassPageInfoHeader--description'
            : 'mobileClassPageInfoHeader--descriptionHidden'
        }
      >
        <span dangerouslySetInnerHTML={{ __html: latestOccurrence.desc }} />
      </div>
      <div
        className="mobileClassPageInfoHeader--seeMore"
        role="button"
        tabIndex={0}
        onClick={() => setSeeMore(!seeMore)}
      >
        {seeMore ? 'see less' : 'see more'}
      </div>
    </div>
  );
}
