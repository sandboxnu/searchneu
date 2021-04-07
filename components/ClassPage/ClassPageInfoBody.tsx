import { mean } from 'lodash';
import React, { ReactElement } from 'react';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import { HeaderBody } from './HeaderBody';
import {
  getCourseLevel,
  getProfessors,
  getRecentSemesterNames,
  numberOfSections,
  seatsAvailable,
  seatsFilled,
} from './PageContentService';

type ClassPageInfoProp = {
  classPageInfo: GetClassPageInfoQuery;
};

export default function ClassPageInfoBody({
  classPageInfo,
}: ClassPageInfoProp): ReactElement {
  const latestOccurrence = classPageInfo.class.latestOccurrence;
  return (
    <div className="classPageBody flex justify-space-between">
      <div className="classPageBodyLeft">
        <HeaderBody
          header="COURSE DESCRIPTION"
          body={<p>{latestOccurrence.desc}</p>}
        />
        <HeaderBody
          header="COURSE LEVEL"
          body={<p>{getCourseLevel(latestOccurrence.termId.toString())}</p>}
        />
      </div>
      <div className="verticalLine" />
      <div className="classPageBodyRight">
        <HeaderBody
          header="RECENT PROFESSORS"
          body={<p>{getProfessors(classPageInfo, 10).join(', ')}</p>}
        />
        <HeaderBody
          header="RECENT SEMESTERS"
          body={<p>{getRecentSemesterNames(classPageInfo, 6).join(', ')}</p>}
        />
        <div className="flex justify-space-between">
          <HeaderBody
            className="lg-text avgSeatsFilled"
            header="AVG SEATS FILLED"
            body={<p>{Math.round(mean(seatsFilled(classPageInfo)))}</p>}
          />
          <HeaderBody
            className="lg-text avgSeatsAvail"
            header="AVG SEATS AVAILABLE"
            body={<p>{Math.round(mean(seatsAvailable(classPageInfo)))}</p>}
          />
        </div>
        <div className="flex justify-space-between">
          <HeaderBody
            className="lg-text avgNumSections"
            header="AVG # SECTIONS"
            body={<p>{Math.round(mean(numberOfSections(classPageInfo)))}</p>}
          />
          <HeaderBody
            className={`lg-text courseFees ${
              latestOccurrence.feeAmount ? '' : 'emptyCourseFee'
            } `}
            header="COURSE FEES"
            body={
              <p>
                {latestOccurrence.feeAmount
                  ? `$${latestOccurrence.feeAmount.toLocaleString()}`
                  : 'None'}
              </p>
            }
          />
        </div>
      </div>
    </div>
  );
}
