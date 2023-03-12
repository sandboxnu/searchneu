import { ReactElement, useEffect, useState } from 'react';
import Cookies from 'universal-cookie';
import axios from 'axios';
import { useRouter } from 'next/router';
import { UserInfo } from '../components/types';
import { gqlClient } from '../utils/courseAPIClient';
import { PacmanLoader } from 'react-spinners';
import { timeout } from 'q';

const cookies = new Cookies();

export default function SubscrptionsPage(): ReactElement {
  const [userInfo, setUserInfo] = useState<UserInfo>(null);
  const [subscriptions, setSubs] = useState([]);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = cookies.get('SearchNEU JWT');

    if (!token) {
      router.push('/');
    } else {
      axios
        .get(
          `${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/user/subscriptions/${token}`
        )
        .then(({ data }) => {
          setUserInfo({ token, ...data });
        });
    }
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      if (userInfo) {
        let termId = '';
        const subElements = [];
        for (let i = 0; i < userInfo.sectionIds.length; i++) {
          const curSectionInfo = userInfo.sectionIds[i].split('/');
          const subject = curSectionInfo[2];
          const courseId = curSectionInfo[3];
          const crn = curSectionInfo[4];
          termId = curSectionInfo[1];

          const result = await gqlClient.searchResults({
            termId: termId,
            subject: subject,
            query: subject + courseId,
          });

          if (result.search.nodes[0].type == 'ClassOccurrence') {
            for (let j = 0; j < result.search.nodes[0].sections.length; j++) {
              if (result.search.nodes[0].sections[j].crn == crn) {
                subElements.push(
                  <div key={j}>
                    <div>Name: {result.search.nodes[0].name}</div>
                    <div>
                      Section Professors:{' '}
                      {result.search.nodes[0].sections[j].profs}
                    </div>
                    <div>Time: 100</div>
                  </div>
                );
              }
            }
          } else {
            throw new Error("Can't have subscriptions for an Employee");
          }
        }

        for (let i = 0; i < userInfo.courseIds.length; i++) {
          const curSectionInfo = userInfo.courseIds[i].split('/');
          const subject = curSectionInfo[2];
          const courseId = curSectionInfo[3];
          termId = curSectionInfo[1];

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
        setSubs(subElements);
      }
    };
    fetchNotifs().catch((e) => {
      console.log('subscription error with employees');
    });
    setTimeout(() => {
      setFetching(false);
    }, 300);
  }, [userInfo]);

  return (
    <>
      {fetching ? (
        <PacmanLoader loading={fetching} size={30} />
      ) : (
        <>
          <h2>This page is a work in progress!</h2>
          <div>{subscriptions}</div>
        </>
      )}
    </>
  );
}
