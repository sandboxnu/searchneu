import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import {
  ClassPageInfoBody,
  MobileClassPageInfoBody,
} from './ClassPageInfoBody';
import {
  ClassPageInfoHeader,
  MobileClassPageInfoHeader,
} from './ClassPageInfoHeader';
import {
  ClassPageReqsBody,
  MobileClassPageReqsBody,
} from './ClassPageReqsBody';
import {
  ClassPageSections,
  MobileClassPageSections,
} from './ClassPageSections';
import macros from '../macros';
import IconArrowFlipped from '../icons/IconArrowFlipped';

type PageContentProps = {
  termId: string;
  campus: string;
  subject: string;
  classId: string;
  classPageInfo: GetClassPageInfoQuery;
  isCoreq: boolean;
};

export default function PageContent({
  termId,
  campus,
  subject,
  classId,
  classPageInfo,
  isCoreq,
}: PageContentProps): ReactElement {
  const router = useRouter();

  // TODO: hacky front-end solution because for some reason allOccurrences includes
  // termIds where there are no sections. This should probably be fixed on the backend.
  if (classPageInfo && classPageInfo.class) {
    classPageInfo.class.allOccurrences = classPageInfo.class.allOccurrences.filter(
      (occurrence) => occurrence.sections.length > 0
    );
  }
  return (
    <div className={`pageContent ${isCoreq ? 'coreqPageContent' : ''}`}>
      {isCoreq ? (
        <h2 className="coreqHeader">
          COREQUISITES for
          <span className="coreqHeaderCourse">{` ${subject}${classId}`}</span>
        </h2>
      ) : macros.isMobile ? (
        <div className="mobileBackToResults" onClick={() => router.back()}>
          <IconArrowFlipped fill="#858585" />
          Back to search
        </div>
      ) : (
        <div className="backToResults" onClick={() => router.back()}>
          Back to Search Results
        </div>
      )}
      {classPageInfo &&
        classPageInfo.class &&
        (macros.isMobile ? (
          <div className="classPageInfoContent">
            <MobileClassPageInfoHeader classPageInfo={classPageInfo} />
            <div
              className="mobileHorizontalLine"
              style={{ margin: '0px 19px' }}
            />
            <MobileClassPageReqsBody
              termId={termId}
              campus={campus}
              classPageInfo={classPageInfo}
            ></MobileClassPageReqsBody>
            <MobileClassPageInfoBody classPageInfo={classPageInfo} />
            <MobileClassPageSections classPageInfo={classPageInfo} />
          </div>
        ) : (
          <div className="classPageInfoContent">
            <ClassPageInfoHeader classPageInfo={classPageInfo} />
            <div className="horizontalLine" />
            <ClassPageInfoBody classPageInfo={classPageInfo} />
            <div className="horizontalLine" />
            <ClassPageReqsBody
              termId={termId}
              campus={campus}
              classPageInfo={classPageInfo}
            />
            <div className="horizontalLine" />
            <ClassPageSections classPageInfo={classPageInfo} />
            <div className="horizontalLine" />
          </div>
        ))}
    </div>
  );
}
