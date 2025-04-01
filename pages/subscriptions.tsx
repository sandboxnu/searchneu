import { useRouter } from 'next/router';
import { ReactElement, useEffect, useState } from 'react';
import { PacmanLoader } from 'react-spinners';
import Header from '../components/Header';
import { ClassCard } from '../components/SubscriptionsPage/ClassCard';
import { SubscriptionCourse } from '../components/types';
import { gqlClient } from '../utils/courseAPIClient';
import useUserInfo from '../utils/useUserInfo';
import { EmptyCard } from '../components/SubscriptionsPage/EmptyCard';
import getTermInfosWithError from '../utils/TermInfoProvider';
import { getTermName, getLatestTerm } from '../components/terms';
import { Campus } from '../components/types';
import Keys from '../components/Keys';
import axios from 'axios';

async function fetchCourseNotifs(termMapping, courseIds) {
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

    const filteredSections = result.classByHash.sections.map((s) => {
      return {
        ...s,
        online: false,
        subject: subject,
        classId: classId,
        host: host,
        termId: termId,
      };
    });

    // If no sections are available, skip this course
    if (filteredSections.length === 0) {
      continue;
    }

    // Ensure termIdInt exists in the outer map
    if (!termMapping.has(termId)) {
      termMapping.set(termId, new Map());
    }

    termMapping.get(termId)!.set(courseCode, {
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

async function fetchSectionNotifs(termMapping, sectionIds) {
  for (const sectionId of sectionIds) {
    const result = await gqlClient.getSectionInfoByHash({
      hash: sectionId,
    });
    const courseCode =
      result.sectionByHash.subject + result.sectionByHash.classId;

    const sectionHashSlice = sectionId.split('/');
    const courseHash = sectionHashSlice.slice(0, -1).join('/');

    const courseResult = await gqlClient.getCourseInfoByHash({
      hash: courseHash,
    });

    const subject = courseResult.classByHash.subject;
    const classId = courseResult.classByHash.classId;
    const host = courseResult.classByHash.host;
    const termId = courseResult.classByHash.termId;

    // Ensure termIdInt exists in the outer map
    if (!termMapping.has(termId)) {
      termMapping.set(termId, new Map());
    }

    const classMap = termMapping.get(termId)!;

    // If course has already been found in fetchCourseNotifs(), continue
    if (!classMap.has(courseCode)) {
      const filteredSections = courseResult.classByHash.sections.map((s) => {
        return {
          ...s,
          online: false,
          subject: subject,
          classId: classId,
          host: host,
          termId: termId,
        };
      });

      // If no sections are available, skip this course
      if (filteredSections.length === 0) {
        continue;
      }

      classMap.set(courseCode, {
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

  // Represents a mapping of termId to a mapping of courseCode to SubscriptionCourse
  // Example:
  // {
  //   "202530": {
  //     'CS2500': SubscriptionCourse,
  //     'COMM1100': SubscriptionCourse,
  //   },
  //   "202510": {
  //     'CS2500': SubscriptionCourse,
  //     'MATH1341': SubscriptionCourse,
  //   },
  // }
  // When displayed, its most recent semester first (highest termId), then courses in alphabetical order
  const [classes, setClasses] = useState(
    new Map<string, Map<string, SubscriptionCourse>>()
  );

  // is the course / section data still fetching
  const [isFetching, setIsFetching] = useState(true);
  // is the user subscribed to at least one class
  const [isSubscribed, setIsSubscribed] = useState(false);

  const termInfos = getTermInfosWithError().termInfos;
  const termId = getLatestTerm(termInfos, Campus.NEU);
  const termName = getTermName(termInfos, termId).replace('Semester', '');

  useEffect(() => {
    if (isUserInfoLoading) {
      return;
    }

    // not logged in
    if (!userInfo && !isUserInfoLoading) {
      router.push('/');
      return;
    }

    const classMapping = new Map<string, Map<string, SubscriptionCourse>>();
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

  const unsubscribeAll = () => {
    const allSections = Array.from(classes.values()).flatMap((courseMap) =>
      Array.from(courseMap.values()).flatMap((course) => course.sections)
    );
    axios
      .delete(`${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/user/subscriptions`, {
        data: {
          token: userInfo.token,
          sectionIds: allSections.map((s) => Keys.getSectionHash(s)),
          // courseIds: [Keys.getClassHash(course)],
        },
      })
      .then(() => fetchUserInfo());
  };

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
          campus={null}
          termId={null}
          searchData={null}
          userInfo={userInfo}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
        />
      </div>

      {isSubscribed ? (
        <div className="Results_Container">
          <div className="Results_MainWrapper">
            <div className="Results_Main">
              <div className="Subscriptions_Header_Container">
                <h2 className="Subscriptions_Title">Notifications</h2>
                <button
                  className="Unsubscribe_All_Button"
                  onClick={unsubscribeAll}
                >
                  <img src="/unsubscribe.svg" className="Unsubscribe_Icon" />
                  Unsubscribe All
                </button>
              </div>
              {/* Sort termId keys and iterate over them */}
              {Array.from(classes.keys())
                .sort((a, b) => parseInt(b) - parseInt(a)) // Sort termIds in descending order
                .map((termId) => (
                  <div key={termId}>
                    <h3>{getTermName(termInfos, termId)}</h3>
                    {/* Get the courses map for this termId and sort courses */}
                    {Array.from(classes.get(termId)!.entries())
                      .sort(([codeA], [codeB]) => codeA.localeCompare(codeB)) // Sort courses by courseCode
                      .map(([courseCode, course]) => (
                        <ClassCard
                          key={courseCode}
                          course={course}
                          sections={course.sections}
                          userInfo={userInfo}
                          fetchUserInfo={fetchUserInfo}
                          onSignIn={onSignIn}
                        />
                      ))}
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyCard />
      )}
    </>
  );
}
