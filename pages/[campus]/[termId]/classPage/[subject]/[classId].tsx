import { useRouter } from 'next/router';
import React from 'react';
import Header from '../../../../../components/Header';
import PageContent from '../../../../../components/ClassPage/PageContent';

export default function Page() {
  const router = useRouter();

  const termId = router.query.termId as string;
  const campus = router.query.campus as string;
  const subject = router.query.subject as string;
  const classId = router.query.classId as string;

  if (!termId || !campus) return null;
  return (
    <div>
      <Header
        router={router}
        title={`${subject}${classId}`}
        searchData={null}
      ></Header>

      <PageContent
        termId={termId}
        campus={campus}
        subject={subject}
        classId={classId}
      />
    </div>
  );
}
