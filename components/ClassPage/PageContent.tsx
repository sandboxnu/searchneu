import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import ClassPageInfoHeader from './ClassPageInfoHeader';
import ClassPageInfoBody from './ClassPageInfoBody';
import ClassPageReqsBody from './ClassPageReqsBody';

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

  return (
    <div className="pageContent">
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
          <div className="horizontalLine" />
          <div className="horizontalLine" />
          <div className="horizontalLine" />
          <div className="horizontalLine" />
        </div>
      )}
    </div>
  );
}
