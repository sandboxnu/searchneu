import { useRouter } from 'next/router';
import React, { ReactElement, useEffect, useState } from 'react';
import pMap from 'p-map';
import PageContent from '../../../../../components/ClassPage/PageContent';
import Header from '../../../../../components/Header';
import { CompositeReq, CourseReq } from '../../../../../components/types';
import { GetClassPageInfoQuery } from '../../../../../generated/graphql';
import { gqlClient } from '../../../../../utils/courseAPIClient';

export default function Page(): ReactElement {
  const router = useRouter();

  const termId = router.query.termId as string;
  const campus = router.query.campus as string;
  const subject = ((router.query.subject as string) || '').toUpperCase();
  const classId = router.query.classId as string;

  if (!termId || !campus) return null;

  const termAndCampusToURL = (t: string, newCampus: string): string => {
    return `/${newCampus}/${t}/classPage/${subject}/${classId}${window.location.search}`;
  };

  const [classPageInfo, setClassPageInfo] = useState<GetClassPageInfoQuery>(
    null
  );
  const [coreqInfo, setCoreqInfo] = useState<GetClassPageInfoQuery[]>([]);

  useEffect(() => {
    loadClassPageInfo();
  }, []);

  const loadClassPageInfo = async () => {
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
