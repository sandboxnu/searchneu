import { useRouter } from 'next/router';
import pMap from 'p-map';
import React, { ReactElement, useEffect, useState } from 'react';
import PageContent from '../../../../../components/ClassPage/PageContent';
import Header from '../../../../../components/Header';
import macros from '../../../../../components/macros';
import { CourseReq } from '../../../../../components/types';
import { GetClassPageInfoQuery } from '../../../../../generated/graphql';
import { gqlClient } from '../../../../../utils/courseAPIClient';
import useUserInfo from '../../../../../utils/useUserInfo';

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

  const loadClassPageInfo = async (): Promise<void> => {
    const classPage = await gqlClient.getClassPageInfo({ subject, classId });
    if ((subject || classId) && !classPage.class) {
      router.push('/404');
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, classId]);

  const { userInfo, fetchUserInfo, onSignIn, onSignOut } = useUserInfo();

  useEffect(() => {
    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!termId || !campus) return null;
  return (
    <div>
      <Header
        title={`${subject}${classId}`}
        campus={campus}
        termId={termId}
        searchData={null}
        userInfo={userInfo}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
      />
      {macros.isMobile ? (
        <h3 style={{ margin: '20px' }}>Class pages coming to mobile soon!</h3>
      ) : (
        <>
          <PageContent
            termId={termId}
            campus={campus}
            subject={subject}
            classId={classId}
            classPageInfo={classPageInfo}
            isCoreq={false}
          />
          {coreqInfo.map((info, index) => (
            <PageContent
              key={index}
              termId={termId}
              campus={campus}
              subject={subject}
              classId={classId}
              classPageInfo={info}
              isCoreq={true}
            />
          ))}
        </>
      )}
    </div>
  );
}
