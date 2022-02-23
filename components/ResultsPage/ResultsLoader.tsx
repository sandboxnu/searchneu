import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { cloneDeep, flatten, groupBy, values } from 'lodash';
import React, { ReactElement } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import Keys from '../Keys';
import macros from '../macros';
import EmployeePanel from '../panels/EmployeePanel';
import {
  DayjsTuple,
  Meeting,
  SearchItem,
  Section,
  TimeToDayjs,
  UserInfo,
} from '../types';
import { MobileSearchResult, SearchResult } from './Results/SearchResult';

dayjs.extend(utc);

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

interface ResultsLoaderProps {
  results: SearchItem[];
  loadMore: () => void;
  hasNextPage: boolean;
  userInfo: UserInfo;
  onSignIn: (token: string) => void;
  fetchUserInfo: () => void;
}

export const getGroupedByTimeOfDay = (times): DayjsTuple[] => {
  const timeMoments = [];

  if (times) {
    const dayIndices = Object.keys(times);

    for (const dayIndex of dayIndices) {
      times[dayIndex].forEach((event) => {
        //3 is to set in the second week of 1970
        const day = parseInt(dayIndex, 10) + 3;

        const obj = {
          start: dayjs.utc(event.start * 1000).add(day, 'day'),
          end: dayjs.utc(event.end * 1000).add(day, 'day'),
        };

        if (parseInt(obj.start.format('YYYY'), 10) !== 1970) {
          macros.error();
        }

        timeMoments.push(obj);
      });
    }
  }

  // returns objects like this: {3540000041400000: Array[3]}
  // if has three meetings per week that meet at the same times
  const groupedByTimeOfDay: TimeToDayjs = groupBy(timeMoments, (event) => {
    const zero = dayjs(event.start).startOf('day');
    return `${event.start.diff(zero)}${event.end.diff(zero)}`;
  });

  // Get the values of the object returned above
  const valuesGroupedByTimeOfDay: DayjsTuple[][] = values(groupedByTimeOfDay);

  // And sort by start time
  valuesGroupedByTimeOfDay.sort((meetingsInAday) => {
    const zero = dayjs(meetingsInAday[0].start).startOf('day');
    return meetingsInAday[0].start.diff(zero);
  });

  return flatten(valuesGroupedByTimeOfDay);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getFormattedSections = (sections: any): Section[] => {
  const formattedSections: Section[] = [];

  sections.forEach((section) => {
    const formattedMeetings: Meeting[] = [];

    section.meetings.forEach((meeting) => {
      formattedMeetings.push({
        location: meeting.where,
        startDate: dayjs((meeting.startDate + 1) * DAY_IN_MILLISECONDS),
        endDate: dayjs((meeting.endDate + 1) * DAY_IN_MILLISECONDS),
        times: getGroupedByTimeOfDay(meeting.times),
        type: meeting.type,
      });
    });

    section.meetings = formattedMeetings;
    formattedSections.push(section);
  });

  return formattedSections;
};

function ResultsLoader({
  results,
  loadMore,
  hasNextPage,
  userInfo,
  onSignIn,
  fetchUserInfo,
}: ResultsLoaderProps): ReactElement {
  return (
    <InfiniteScroll
      dataLength={results.length}
      next={loadMore}
      hasMore={hasNextPage}
      loader={null}
    >
      <div className="five column row">
        <div className="page-home">
          {results
            .filter((result) => result !== null && result !== undefined)
            .map((result) => {
              return (
                <ResultItemMemoized
                  key={
                    result.type === 'class'
                      ? Keys.getClassHash(result.class)
                      : result.employee.id
                  }
                  result={result}
                  userInfo={userInfo}
                  onSignIn={onSignIn}
                  fetchUserInfo={fetchUserInfo}
                />
              );
            })}
        </div>
      </div>
    </InfiniteScroll>
  );
}

// Memoize result items to avoid unneeded re-renders and to reuse
// If the Panels are updated to function components, we can memoize them instead and remove this
const ResultItemMemoized = React.memo(function ResultItemMemoized({
  result,
  userInfo,
  onSignIn,
  fetchUserInfo,
}: {
  result: SearchItem;
  userInfo: UserInfo;
  onSignIn: (token: string) => void;
  fetchUserInfo: () => void;
}) {
  if (result.type === 'class') {
    const course = result.class;
    // TODO: Can we get rid of this clone deep?
    course.sections = getFormattedSections(cloneDeep(result.sections));
    return macros.isMobile ? (
      <MobileSearchResult
        course={course}
        userInfo={userInfo}
        onSignIn={onSignIn}
        fetchUserInfo={fetchUserInfo}
      />
    ) : (
      <SearchResult
        course={course}
        userInfo={userInfo}
        onSignIn={onSignIn}
        fetchUserInfo={fetchUserInfo}
      />
    );
  }

  if (result.type === 'employee') {
    return <EmployeePanel employee={result.employee} />;
  }

  macros.log('Unknown type', result.type);
  return null;
});

export default ResultsLoader;
