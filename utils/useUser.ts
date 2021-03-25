import axios from 'axios';
import { without } from 'lodash';
import useSWR from 'swr';
import Keys from '../components/Keys';
import macros from '../components/macros';
import { Course, Section } from '../components/types';
import {
  DeleteSubscriptionBody,
  PostSubscriptionBody,
} from '../pages/api/subscription';
import { GetUserResponse } from '../pages/api/user';

type UseUserReturn = {
  user: GetUserResponse | undefined;
  subscribeToCourse: (course: Course) => Promise<void>;
  subscribeToSection: (section: Section) => Promise<void>;
  unsubscribeFromSection: (section: Section) => Promise<void>;
  unsubscribeFromCourse: (course: Course) => Promise<void>;
};

export default function useUser(): UseUserReturn {
  const { data: user, error, mutate } = useSWR(
    `/api/user`,
    async (): Promise<GetUserResponse> => (await axios.get('/api/user')).data,
    {
      onErrorRetry: (error) => {
        if (error.status === 401) {
          return;
        }
      },
    }
  );

  const { followedSections = [], followedCourses = [] } = user || {};

  const subscribeToCourseUsingHash = async (
    courseHash: string
  ): Promise<void> => {
    const body: PostSubscriptionBody = {
      courseHash,
    };

    await axios.post('/api/subscription', body);
  };

  const subscribeToCourse = async (course: Course): Promise<void> => {
    const courseHash = Keys.getClassHash(course);
    if (followedCourses.includes(courseHash)) {
      macros.error('user already watching class?', courseHash, user);
      return;
    }

    mutate(
      { followedSections, followedCourses: [...followedCourses, courseHash] },
      false
    );
    await subscribeToCourseUsingHash(courseHash);
    mutate();
  };

  const unsubscribeFromCourse = async (course: Course): Promise<void> => {
    const courseHash = Keys.getClassHash(course);

    if (!followedCourses.includes(courseHash)) {
      macros.error("removed course that doesn't exist on user?", course, user);
      return;
    }

    const sectionHashes = course.sections.map((section) =>
      Keys.getSectionHash(section)
    );

    const body: DeleteSubscriptionBody = {
      courseHash: courseHash,
      sectionHashes: sectionHashes,
    };

    macros.log('Unsubscribing from course', user, courseHash, body);

    mutate(
      {
        followedCourses: without(followedCourses, courseHash),
        followedSections: without(followedSections, ...sectionHashes),
      },
      false
    );

    await axios.delete('/api/subscription', {
      headers: {
        Authorization: '', // TODO: Figure out this stuff whenever the backend gets fixed.
      },
      data: {
        ...body,
      },
    });

    mutate();
  };

  const subscribeToSection = async (section: Section): Promise<void> => {
    if (section.seatsRemaining > 5) {
      macros.error('Not signing up for section that has over 5 seats open.');
      return;
    }
    const sectionHash = Keys.getSectionHash(section);

    if (followedSections.includes(sectionHash)) {
      macros.error('user already watching section?', section, user);
      return;
    }

    const courseHash = Keys.getClassHash(section);

    const body: PostSubscriptionBody = {
      sectionHash,
    };

    if (!followedCourses.includes(courseHash)) {
      await subscribeToCourseUsingHash(courseHash);
    }

    macros.log('Adding section to user', user, sectionHash, body);

    mutate(
      {
        followedCourses: [...followedCourses, courseHash],
        followedSections: [...followedSections, sectionHash],
      },
      false
    );
    await axios.post('/api/subscription', body);

    mutate();
  };

  const unsubscribeFromSection = async (section: Section): Promise<void> => {
    const sectionHash = Keys.getSectionHash(section);

    if (!followedSections.includes(sectionHash)) {
      macros.error(
        "removed section that doesn't exist on user?",
        section,
        user
      );
      return;
    }

    const body: DeleteSubscriptionBody = {
      sectionHash: sectionHash,
    };

    mutate(
      {
        followedCourses,
        followedSections: without(user?.followedSections, sectionHash),
      },
      false
    );
    await axios.delete('/api/subscription', {
      headers: {
        Authorization: '', // TODO: Figure out this stuff whenever the backend gets fixed.
      },
      data: {
        ...body,
      },
    });

    mutate();
  };

  return {
    user,
    subscribeToCourse,
    subscribeToSection,
    unsubscribeFromSection,
    unsubscribeFromCourse,
  };
}
