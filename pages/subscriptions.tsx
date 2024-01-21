import { ReactElement, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { gqlClient } from '../utils/courseAPIClient';
import { PacmanLoader } from 'react-spinners';
import useUserInfo from '../utils/useUserInfo';
import { Section, SubscriptionCourse } from '../components/types';
import { ClassCard } from '../components/SubscriptionsPage/ClassCard';

export default function SubscriptionsPage(): ReactElement {
  const [userInfo, isLoading] = useUserInfo();
  const [sections, setSections] = useState(new Map());
  const [classes, setClasses] = useState(new Map());

  // is the course / section data still fetching
  const [isFetching, setIsFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!userInfo && !isLoading) {
      router.push('/');
      return;
    }

    const classSectionMapping = new Map<string, Section[]>();
    const classMapping = new Map<string, SubscriptionCourse>();

    const fetchCourseNotifs = async (): Promise<void> => {
      for (const courseId of userInfo.courseIds) {
        const result = await gqlClient.getCourseInfoByHash({
          hash: courseId,
        });

        // Creates a string of subject and id like CS2500
        const courseCode =
          result.classByHash.subject + result.classByHash.classId;

        classSectionMapping.set(courseCode, []);

        classMapping.set(courseCode, {
          subject: result.classByHash.subject,
          classId: result.classByHash.classId,
          name: result.classByHash.name,
        });
      }
    };

    const fetchSectionNotifs = async (): Promise<void> => {
      for (const sectionId of userInfo.sectionIds) {
        const result = await gqlClient.getSectionInfoByHash({
          hash: sectionId,
        });
        const courseCode =
          result.sectionByHash.subject + result.sectionByHash.classId;
        const sectionObj: Section = {
          crn: result.sectionByHash.crn,
          profs: result.sectionByHash.profs,
          meetings: result.sectionByHash.meetings,
          seatsRemaining: result.sectionByHash.seatsRemaining,
          seatsCapacity: result.sectionByHash.seatsCapacity,
          waitRemaining: result.sectionByHash.seatsRemaining,
          waitCapacity: result.sectionByHash.seatsCapacity,
          honors: result.sectionByHash.honors,
          campus: result.sectionByHash.campus,
          campusDescription: '',
          lastUpdateTime: result.sectionByHash.lastUpdateTime,
          url: result.sectionByHash.url,
          online: null,
        };

        if (classSectionMapping.has(courseCode)) {
          classSectionMapping.get(courseCode).push(sectionObj);
        } else {
          const sectionHashSlice = sectionId.split('/');
          const courseHash = sectionHashSlice.slice(0, -1).join('/');

          // sections don't have information on class name so we have to search for course results
          const courseResult = await gqlClient.getCourseInfoByHash({
            hash: courseHash,
          });

          classMapping.set(courseCode, {
            subject: courseResult.classByHash.subject,
            classId: courseResult.classByHash.classId,
            name: courseResult.classByHash.name,
          });

          classSectionMapping.set(courseCode, [sectionObj]);
        }
      }
    };

    const fetchSubscriptions = async (): Promise<void> => {
      try {
        await fetchSectionNotifs();
        await fetchCourseNotifs();
        setClasses(classMapping);
        setSections(classSectionMapping);
        setIsFetching(false);
      } catch (e) {
        console.log(e);
      }
    };
    fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.phoneNumber, isLoading]); // Only depends on userInfo data

  return (
    <>
      {isFetching ? (
        <PacmanLoader loading={isFetching} size={30} />
      ) : (
        <>
          <div className="Results_Container">
            <div className="Results_MainWrapper">
              <div className="Results_Main">
                <h2>This page is a work in progress!</h2>
                {Array.from(sections).map(([courseCode, sections]) => {
                  const course = classes.get(courseCode);
                  return (
                    <ClassCard
                      key={courseCode}
                      course={course}
                      sections={sections}
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
