import React from 'react';
import { useRouter } from 'next/router';
import { getLatestTerm } from '../../../../components/global';
import { Campus } from '../../../../components/types';

export default function Home() {
  const router = useRouter();

  const campus = (router.query.campus as Campus) || Campus.NEU;
  const LATEST_TERM = getLatestTerm(campus);
  const termId = (router.query.termId as string) || LATEST_TERM;
  const query = (router.query.query as string) || '';

  console.log(campus, LATEST_TERM, termId, query);

  return (
    <div>
      <h1>Hello World!</h1>
    </div>
  );
}
