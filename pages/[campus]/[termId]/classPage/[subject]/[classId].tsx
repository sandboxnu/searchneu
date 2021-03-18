import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import PageContent from '../../../../../components/ClassPage/PageContent';
import Header from '../../../../../components/Header';
import { GetClassPageInfoQuery } from '../../../../../generated/graphql';
import { gqlClient } from '../../../../../utils/courseAPIClient';

export default function Page() {
  const router = useRouter();

  const termId = router.query.termId as string;
  const campus = router.query.campus as string;
  const subject = router.query.subject as string;
  const classId = router.query.classId as string;

  if (!termId || !campus) return null;

  const [classPageInfo, setClassPageInfo] = useState<GetClassPageInfoQuery>(
    null
  );

  useEffect(() => {
    loadClassPageInfo();
  }, []);

  const loadClassPageInfo = async () => {
    setClassPageInfo(await gqlClient.getClassPageInfo({ subject, classId }));
  };

  return (
    <div>
      <Header
        router={router}
        title={`${subject}${classId}`}
        searchData={null}
      />

      <PageContent
        subject={subject}
        classId={classId}
        classPageInfo={classPageInfo}
      />
    </div>
  );
}
