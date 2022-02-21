import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import ClassPageInfoBody from './ClassPageInfoBody';
import ClassPageInfoHeader from './ClassPageInfoHeader';
import ClassPageReqsBody from './ClassPageReqsBody';
import ClassPageSections from './ClassPageSections';

export type PageContentProps = {
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
      ) : (
        <div className="backToResults" onClick={() => router.back()}>
          Back to Search Results
        </div>
      )}
      {classPageInfo && classPageInfo.class && (
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
      )}
    </div>
  );
}
