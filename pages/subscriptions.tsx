import { ReactElement, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { gqlClient } from '../utils/courseAPIClient';
import { PacmanLoader } from 'react-spinners';
import useUserInfo from '../utils/useUserInfo';
import { SubscriptionCourse } from '../components/types';
import { ClassCard } from '../components/SubscriptionsPage/ClassCard';

export default function SubscriptionsPage(): ReactElement {
  const {
    userInfo,
    isUserInfoLoading,
    fetchUserInfo,
    onSignIn,
  } = useUserInfo();
  const [classes, setClasses] = useState(new Map<string, SubscriptionCourse>());

  // is the course / section data still fetching
  const [isFetching, setIsFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isUserInfoLoading) {
      return;
    }

    if (!userInfo && !isUserInfoLoading) {
      router.push('/');
      return;
    }

    const classMapping = new Map<string, SubscriptionCourse>();

    // This uses subscribed course ids to find the associated courses and their sections
    const fetchCourseNotifs = async (): Promise<void> => {
      for (const courseId of userInfo.courseIds) {
        const result = await gqlClient.getCourseInfoByHash({
          hash: courseId,
        });

        // Creates a string of subject and id like CS2500
        const courseCode =
          result.classByHash.subject + result.classByHash.classId;

        const subject = result.classByHash.subject;
        const classId = result.classByHash.classId;
        const host = result.classByHash.host;
        const termId = result.classByHash.termId;

        // The subscription page should only show sections that we can subscribe to.
        // We identify such sections as those with less than 5 seats remaining.
        const filteredSections = result.classByHash.sections
          .filter((s) => {
            return s.seatsRemaining <= 5;
          })
          .map((s) => {
            return {
              ...s,
              online: false,
              subject: subject,
              classId: classId,
              host: host,
              termId: termId,
            };
          });
        classMapping.set(courseCode, {
          subject: subject,
          classId: classId,
          termId: termId,
          host: host,
          name: result.classByHash.name,
          lastUpdateTime: result.classByHash.lastUpdateTime,
          sections: filteredSections,
        });
      }
    };

    // This uses subscribed section ids to find the associated section and the associated course for that section
    const fetchSectionNotifs = async (): Promise<void> => {
      for (const sectionId of userInfo.sectionIds) {
        const result = await gqlClient.getSectionInfoByHash({
          hash: sectionId,
        });
        const courseCode =
          result.sectionByHash.subject + result.sectionByHash.classId;

        // If course has already been found in fetchCourseNotifs(), continue
        if (!classMapping.has(courseCode)) {
          const sectionHashSlice = sectionId.split('/');
          const courseHash = sectionHashSlice.slice(0, -1).join('/');

          const courseResult = await gqlClient.getCourseInfoByHash({
            hash: courseHash,
          });

          const subject = courseResult.classByHash.subject;
          const classId = courseResult.classByHash.classId;
          const host = courseResult.classByHash.host;
          const termId = courseResult.classByHash.termId;

          const filteredSections = courseResult.classByHash.sections
            .filter((s) => {
              return s.seatsRemaining <= 5;
            })
            .map((s) => {
              return {
                ...s,
                online: false,
                subject: subject,
                classId: classId,
                host: host,
                termId: termId,
              };
            });
          classMapping.set(courseCode, {
            subject: subject,
            classId: classId,
            termId: termId,
            host: host,
            name: courseResult.classByHash.name,
            lastUpdateTime: courseResult.classByHash.lastUpdateTime,
            sections: filteredSections,
          });
        }
      }
    };

    const fetchSubscriptions = async (): Promise<void> => {
      try {
        await fetchCourseNotifs();
        await fetchSectionNotifs();
        setClasses(classMapping);
        setIsFetching(false);
      } catch (e) {
        console.log(e);
      }
    };
    fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.phoneNumber, isUserInfoLoading]); // Only depends on userInfo data

  return (
    <>
      {isFetching ? (
        <PacmanLoader loading={isFetching} size={30} />
      ) : (
        <>
          <div className="Results_Container">
            <div className="Results_MainWrapper">
              <div className="Results_Main">
                <h2>Subscriptions</h2>
                {Array.from(classes).map(([courseCode, course]) => {
                  return (
                    <ClassCard
                      key={courseCode}
                      course={course}
                      sections={course.sections}
                      userInfo={userInfo}
                      fetchUserInfo={fetchUserInfo}
                      onSignIn={onSignIn}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
