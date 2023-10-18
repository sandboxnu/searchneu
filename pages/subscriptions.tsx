import { ReactElement, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { gqlClient } from '../utils/courseAPIClient';
import { PacmanLoader } from 'react-spinners';
import useUserInfo from '../utils/useUserInfo';

export default function SubscriptionsPage(): ReactElement {
  const [userInfo, isLoading] = useUserInfo();
  const [subscriptions, setSubscriptions] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!userInfo && !isLoading) {
      console.log('GOING BACK TO HOME');
      router.push('/');
      return;
    }

    const subElements = [];

    const fetchSectionNotifs = async () => {
      for (const sectionId of userInfo.sectionIds) {
        console.log('section Id: ' + sectionId);
        const result = await gqlClient.getSectionInfoByHash({
          hash: sectionId,
        });

        // if (result.search.nodes[0].type == 'ClassOccurrence') {
        //   for (let j = 0; j < result.search.nodes[0].sections.length; j++) {
        //     if (result.search.nodes[0].sections[j].crn == crn) {
        //       subElements.push(
        //         <div key={j}>
        //           <div>Name: {result.search.nodes[0].name}</div>
        //           <div>
        //             Section Professors: {result.search.nodes[0].sections[j].profs}
        //           </div>
        //         </div>
        //       );
        //     }
        //   }
        // } else {
        //   throw new Error("Can't have subscriptions for an employee");
        // }
      }
    };
    const fetchCourseNotifs = async () => {
      for (let i = 0; i < userInfo.courseIds.length; i++) {
        const curSectionInfo = userInfo.courseIds[i].split('/');
        const subject = curSectionInfo[2];
        const courseId = curSectionInfo[3];
        const termId = curSectionInfo[1];

        const results = await gqlClient.searchResults({
          termId: termId,
          subject: subject,
          query: subject + courseId,
        });

        if (results.search.nodes[0].type == 'ClassOccurrence') {
          subElements.push(
            <div key={i + userInfo.sectionIds.length}>
              <div>Class Name: {results.search.nodes[0].name}</div>
            </div>
          );
        } else {
          throw new Error("Can't have subscriptions for an employee");
        }
      }
      setSubscriptions(subElements);
    };

    fetchSectionNotifs().catch((e) => {
      console.log(e.message);
    });

    setIsFetching(false);
  }, [userInfo, isLoading]);

  return (
    <>
      {isFetching ? (
        <PacmanLoader loading={isFetching} size={30} />
      ) : (
        <>
          <h2>This page is a work in progress!</h2>
          <div>{subscriptions}</div>
        </>
      )}
    </>
  );
}
