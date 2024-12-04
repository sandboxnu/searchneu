import { useRouter } from 'next/router';
import { ReactElement, useEffect, useState } from 'react';
import { PacmanLoader } from 'react-spinners';
import Header from '../components/Header';
import { ClassCard } from '../components/SubscriptionsPage/ClassCard';
import { SubscriptionCourse } from '../components/types';
import { gqlClient } from '../utils/courseAPIClient';
import useUserInfo from '../utils/useUserInfo';
import { EmptyCard } from '../components/SubscriptionsPage/EmptyCard';

async function fetchCourseNotifs(classMapping, courseIds) {
  for (const courseId of courseIds) {
    const result = await gqlClient.getCourseInfoByHash({
      hash: courseId,
    });

    // Creates a string of subject and id like CS2500
    const courseCode = result.classByHash.subject + result.classByHash.classId;

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
}

async function fetchSectionNotifs(classMapping, sectionIds) {
  for (const sectionId of sectionIds) {
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
}

export default function SubscriptionsPage(): ReactElement {
  const router = useRouter();
  const {
    userInfo,
    isUserInfoLoading,
    fetchUserInfo,
    onSignIn,
    onSignOut,
  } = useUserInfo();
  const [classes, setClasses] = useState(new Map<string, SubscriptionCourse>());

  // is the course / section data still fetching
  const [isFetching, setIsFetching] = useState(true);
  // is the user subscribed to at least one class
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (isUserInfoLoading) {
      return;
    }

    // not logged in
    if (!userInfo && !isUserInfoLoading) {
      router.push('/');
      return;
    }

    const classMapping = new Map<string, SubscriptionCourse>();
    const fetchSubscriptions = async (): Promise<void> => {
      try {
        await fetchCourseNotifs(classMapping, userInfo.courseIds);
        await fetchSectionNotifs(classMapping, userInfo.sectionIds);
        setClasses(classMapping);
        setIsFetching(false);
        // are there classes the user is subscribed to?
        if (classMapping.size > 0) {
          setIsSubscribed(true);
        }
      } catch (e) {
        console.log(e);
      }
    };
    fetchSubscriptions();
  }, [userInfo?.phoneNumber, isUserInfoLoading]);

  if (isFetching) {
    return (
      <>
        <div>
          <Header
            title={`Subscriptions`}
            // TODO (sam 11-04-2024: maybe we can get the previous campus/termid if we wnt to preserve this behavior)
            campus={null}
            termId={null}
            searchData={null}
            userInfo={userInfo}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
          />
        </div>

        <PacmanLoader loading={isFetching} size={30} />
      </>
    );
  }

  return (
    <>
      <div>
        <Header
          title={`Subscriptions`}
          // TODO (sam 11-04-2024: maybe we can get the previous campus/termid if we wnt to preserve this behavior)
          campus={null}
          termId={null}
          searchData={null}
          userInfo={userInfo}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
        />
      </div>
      {isSubscribed ? (
        <>
          <div className="Results_Container">
            <div className="Results_MainWrapper">
              <div className="Results_Main">
                <h2>Subscriptions</h2>
                {Array.from(classes)
                  .sort((a, b) => (a > b ? 1 : -1)) // Sort to ensure the sub order doesn't change
                  .map(([courseCode, course]) => {
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
      ) : (
        <EmptyCard />
      )}
    </>
  );
}
