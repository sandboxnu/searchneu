import { NextRouter, useRouter } from 'next/router';
import React from 'react';
import { GetClassPageInfoQuery } from '../../generated/graphql';

type PageContentProps = {
  subject: string;
  classId: string;
  classPageInfo: GetClassPageInfoQuery;
};

export default function PageContent({
  subject,
  classId,
  classPageInfo,
}: PageContentProps) {
  const router = useRouter();

  return (
    <div className="pageContent">
      <span className="backToResults" onClick={() => router.back()}>
        Back to Search Results
      </span>
      {classPageInfo && (
        <div className="title">
          <div className="titleItems">
            <h1 className="classCode">{`${subject.toUpperCase()}${classId}`}</h1>
            <h2 className="className">{classPageInfo.class.name}</h2>
          </div>
        </div>
      )}
    </div>
  );
}
