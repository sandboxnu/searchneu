import React, { ReactElement } from 'react';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import {
  creditsDescription,
  creditsNumericDisplay,
} from '../common/CreditsDisplay';
import { LastUpdated } from '../common/LastUpdated';

type ClassPageInfoHeaderProps = {
  classPageInfo: GetClassPageInfoQuery;
};

export default function ClassPageInfoHeader({
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
          host={latestOccurrence.host}
          prettyUrl={latestOccurrence.prettyUrl}
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
