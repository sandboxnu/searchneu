import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import Header from '../../../../../components/Header';

export default function Page(): ReactElement {
  const router = useRouter();

  const termId = router.query.termId as string;
  const campus = router.query.campus as string;
  const subject = router.query.subject as string;
  const classId = router.query.classId as string;

  if (!termId || !campus) return null;

  const termAndCampusToURL = (t: string, newCampus: string): string => {
    return `/${newCampus}/${t}/classPage/${subject}/${classId}${window.location.search}`;
  };

  return (
    <Header
      router={router}
      title={`${subject}${classId}`}
      searchData={null}
      termAndCampusToURL={termAndCampusToURL}
    />
  );
}
