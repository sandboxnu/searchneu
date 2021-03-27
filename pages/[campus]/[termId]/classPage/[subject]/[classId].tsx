import { useRouter } from 'next/router';
import pMap from 'p-map';
import React, { ReactElement, useEffect, useState } from 'react';
import PageContent from '../../../../../components/ClassPage/PageContent';
import Header from '../../../../../components/Header';
import { CourseReq } from '../../../../../components/types';
import { GetClassPageInfoQuery } from '../../../../../generated/graphql';
import { gqlClient } from '../../../../../utils/courseAPIClient';

export default function Page(): ReactElement {
  const [classPageInfo, setClassPageInfo] = useState<GetClassPageInfoQuery>(
    null
  );
  const [coreqInfo, setCoreqInfo] = useState<GetClassPageInfoQuery[]>([]);

  const router = useRouter();

  const termId = router.query.termId as string;
  const campus = router.query.campus as string;
  const subject = ((router.query.subject as string) || '').toUpperCase();
  const classId = (router.query.classId as string) || '';

  const termAndCampusToURL = (t: string, newCampus: string): string => {
    return `/${newCampus}/${t}/classPage/${subject}/${classId}${window.location.search}`;
  };

  const loadClassPageInfo = async (): Promise<void> => {
    const classPage = await gqlClient.getClassPageInfo({ subject, classId });
    // assume coreq values will never be nested
    const coreqs: CourseReq[] = classPage.class
      ? classPage.class.latestOccurrence.coreqs.values
      : [];

    const coreqInfoArray = await pMap(coreqs, async (coreqVal) => {
      return await gqlClient.getClassPageInfo({
        subject: coreqVal.subject,
        classId: coreqVal.classId,
      });
    });
    setClassPageInfo(classPage);
    setCoreqInfo(coreqInfoArray);
  };

  useEffect(() => {
    loadClassPageInfo();
  }, [subject, classId]);

  if (!termId || !campus) return null;
  return (
    <div>
      <Header
        router={router}
        title={`${subject}${classId}`}
        searchData={null}
        termAndCampusToURL={termAndCampusToURL}
      />
      <PageContent
        subject={subject}
        classId={classId}
        classPageInfo={classPageInfo}
        isCoreq={false}
      />
      {coreqInfo.map((info, index) => (
        <PageContent
          key={index}
          subject={subject}
          classId={classId}
          classPageInfo={info}
          isCoreq={true}
        />
      ))}
    </div>
  );
}
