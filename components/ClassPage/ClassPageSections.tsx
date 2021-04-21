import dayjs from 'dayjs';
import { chunk, partition, sortBy, uniq, uniqWith } from 'lodash';
import React, { ReactElement, useEffect, useState } from 'react';
import { Dropdown } from 'semantic-ui-react';
import { GetClassPageInfoQuery, Section } from '../../generated/graphql';
import IconGlobe from '../icons/IconGlobe';
import useSectionPanelDetail from '../ResultsPage/Results/useSectionPanelDetail';
import WeekdayBoxes from '../ResultsPage/Results/WeekdayBoxes';
import { getGroupedByTimeOfDay } from '../ResultsPage/ResultsLoader';
import { MeetingType, Meeting } from '../types';
import SectionsTermNav from './SectionsTermNav';

type ClassPageSectionsProps = {
  classPageInfo: GetClassPageInfoQuery;
};

type ClassPageSection = GetClassPageInfoQuery['class']['allOccurrences'][number]['sections'][number];

export default function ClassPageSections({
  classPageInfo,
}: ClassPageSectionsProps): ReactElement {
  const [currTermIndex, setCurrTermIndex] = useState(0);
  const [sectionCampuses, setSectionCampuses] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState('');
  const [sections, setSections] = useState<ClassPageSection[]>([]);

  useEffect(() => {
    setSectionCampuses(getCampusOptions(currTermIndex, classPageInfo));
  }, [currTermIndex, classPageInfo]);

  useEffect(() => {
    setSelectedCampus(sectionCampuses[0]);
  }, [sectionCampuses]);

  useEffect(() => {
    setSections(
      classPageInfo.class.allOccurrences[currTermIndex].sections.filter(
        (section) => section.campus === selectedCampus
      )
    );
  }, [currTermIndex, selectedCampus, classPageInfo]);

  return (
    <div className="classPageSections">
      <div className="sectionsNav flex justify-space-between">
        <div className="campusNav">
          SECTIONS FOR{' '}
          <Dropdown
            compact
            text={(selectedCampus || '').toUpperCase() + ' CAMPUS'}
            className="sectionsCampusDropdown"
          >
            <Dropdown.Menu className="sectionsCampusDropdownMenu">
              {sectionCampuses.map((campus) => (
                <Dropdown.Item
                  className={'sectionsCampusOption'}
                  value={campus}
                  text={campus.toUpperCase() + ' CAMPUS'}
                  selected={campus === selectedCampus}
                  onClick={() => setSelectedCampus(campus)}
                  key={campus}
                ></Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <SectionsTermNav
          currTermIndex={currTermIndex}
          setCurrTermIndex={setCurrTermIndex}
          classPageInfo={classPageInfo}
        />
      </div>
      <div className="sectionCards">
        {chunk(sections, 2).map((sectionPair, chunkIndex) => {
          return (
            <div key={`sectionCardRow${chunkIndex}`}>
              {chunkIndex > 0 && <div className="horizontalLine" />}
              <div className="flex flex-wrap justify-space-between">
                <SectionCard
                  key={sectionPair[0].crn}
                  section={sectionPair[0]}
                />
                {sectionPair.length === 2 && (
                  <>
                    <div className="verticalLine" />
                    <SectionCard
                      key={sectionPair[1].crn}
                      section={sectionPair[1]}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getCampusOptions(
  currTermIndex: number,
  classPageInfo: GetClassPageInfoQuery
): string[] {
  return sortBy(
    uniq(
      classPageInfo.class.allOccurrences[currTermIndex].sections.map(
        (section) => section.campus
      )
    )
  );
}

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

type SectionCardProps = {
  section: ClassPageSection;
};

function SectionCard({ section }: SectionCardProps): ReactElement {
  const { getSeatsClass } = useSectionPanelDetail(
    section.seatsRemaining,
    section.seatsCapacity
  );
  const [classMeetings, finalExamMeeting] = splitMeetingsAndExamTimes(
    section.meetings
  );
  return (
    <div className="sectionCard">
      <div className="sectionCardProfs">{section.profs.join(', ')}</div>
      <div className="sectionCRN">
        <IconGlobe /> {section.crn}
      </div>
      {classMeetings.map((meeting, index) => {
        return (
          <div
            key={`meeting${index}`}
            className="flex justify-space-between flex-wrap courseMeeting"
          >
            <WeekdayBoxes
              meetingDays={getDaysOfWeekAsBooleans(meeting)}
              meetingType={meeting.type}
            />
            <div>{displayCourseMeetingTimes(meeting)}</div>
            <div>{meeting.where}</div>
          </div>
        );
      })}

      <div className={`seatsAvailable ${getSeatsClass()}`}>
        {`${section.seatsRemaining}/${section.seatsCapacity} Seats Available `}
      </div>
      {finalExamMeeting.map((meeting, index) => {
        return (
          <div key={`finalExam${index}`}>
            {`Final Exam: 
            ${displayFinalExamDate(meeting)} | 
            ${displayFinalExamTimes(meeting)} | 
            ${meeting.where}`}
          </div>
        );
      })}
    </div>
  );
}

type SectionMeeting = GetClassPageInfoQuery['class']['allOccurrences'][number]['sections'][number]['meetings'];

function splitMeetingsAndExamTimes(
  meetings: SectionMeeting
): [SectionMeeting, SectionMeeting] {
  return partition(
    meetings,
    (meeting) => meeting.type !== MeetingType.FINAL_EXAM
  );
}

function displayCourseMeetingTimes(courseMeeting): string {
  const meetingTimes = getGroupedByTimeOfDay(courseMeeting.times);
  return meetingTimes.length === 0
    ? 'TBA'
    : uniqWith(meetingTimes, (time1, time2) => {
        return (
          time1.start.format('h:mm') === time2.start.format('h:mm') &&
          time1.end.format('h:mm A') === time2.end.format('h:mm A')
        );
      })
        .map((meetingTime) => {
          return `${meetingTime.start.format('h:mm')}–${meetingTime.end.format(
            'h:mm A'
          )}`;
        })
        .join(', ');
}

function displayFinalExamDate(finalExamMeeting): string {
  return dayjs((finalExamMeeting.startDate + 1) * DAY_IN_MILLISECONDS).format(
    'ddd M/D'
  );
}

function displayFinalExamTimes(finalExamMeeting): string {
  const meetingTimes = getGroupedByTimeOfDay(finalExamMeeting.times);
  return meetingTimes.length === 0
    ? 'TBA'
    : `${meetingTimes[0].start.format('h:mm')}–${meetingTimes[0].end.format(
        'h:mm A'
      )}`;
}

function getDaysOfWeekAsBooleans(meeting): boolean[] {
  const retVal = [false, false, false, false, false, false, false];

  Object.keys(meeting.times).forEach((key) => {
    retVal[key] = true;
  });
  return retVal;
}
