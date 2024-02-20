import React, { ReactElement, useMemo } from 'react';
import IconGlobe from '../../icons/IconGlobe';
import Keys from '../../Keys';
import {
  DayjsTuple,
  DayOfWeek,
  Meeting,
  MeetingType,
  Section,
} from '../../types';
import useSectionPanelDetail from './useSectionPanelDetail';
import WeekdayBoxes from './WeekdayBoxes';
import Tooltip, { TooltipDirection } from '../../Tooltip';
import SectionCheckBox from '../../panels/SectionCheckBox';
import { UserInfo } from '../../../components/types';
import InfoIconTooltip from '../../common/InfoIconTooltip';

const negTooltipText =
  'Negative seat counts are displayed when academic advisors apply course overrides for students.';

interface SectionPanelProps {
  section: Section;
  userInfo: UserInfo;
  fetchUserInfo: () => void;
}

interface MobileSectionPanelProps {
  section: Section;
  userInfo: UserInfo;
  fetchUserInfo: () => void;
}

const meetsOnDay = (meeting: Meeting, dayIndex: DayOfWeek): boolean => {
  return meeting.times.some((time) => {
    return time.start.day() === dayIndex;
  });
};

// Unique list of all professors in all meetings, sorted alphabetically, unescape html entity decoding
const getProfs = (section: Section): string[] => {
  return section.profs.length > 0
    ? Array.from(section.profs.map((prof) => unescape(prof))).sort()
    : ['TBA'];
};

const getAllMeetingMoments = (
  section: Section,
  ignoreExams = true
): DayjsTuple[] => {
  let retVal = [];
  section.meetings.forEach((meeting) => {
    if (ignoreExams && meeting.startDate.unix() === meeting.endDate.unix()) {
      return;
    }

    retVal = retVal.concat(meeting.times);
  });

  retVal.sort((a, b) => {
    return a.start.unix() - b.start.unix();
  });

  return retVal;
};

const getDaysOfWeekAsBooleans = (section: Section): boolean[] => {
  const retVal = [false, false, false, false, false, false, false];

  getAllMeetingMoments(section).forEach((time) => {
    retVal[time.start.day()] = true;
  });

  return retVal;
};

export function DesktopSectionPanel({
  section,
  userInfo,
  fetchUserInfo,
}: SectionPanelProps): ReactElement {
  const { getSeatsClass } = useSectionPanelDetail(
    section.seatsRemaining,
    section.seatsCapacity
  );

  const getUniqueTimes = (times: DayjsTuple[]): DayjsTuple[] => {
    const seenTimes = new Set();
    return times.reduce((acc, t) => {
      if (!seenTimes.has(t.start.format('h:mm'))) {
        acc.push(t);
      }
      seenTimes.add(t.start.format('h:mm'));
      return acc;
    }, []);
  };

  const singleMeeting = (
    daysMet: boolean[],
    meeting: Meeting
  ): ReactElement => {
    if (daysMet.some((d) => d)) {
      return (
        <div className="DesktopSectionPanel__meetings">
          <WeekdayBoxes meetingDays={daysMet} meetingType={meeting.type} />
          <div className="DesktopSectionPanel__meetings--times">
            {getUniqueTimes(meeting.times).map((time) => (
              <>
                <span>
                  {meeting.type === MeetingType.FINAL_EXAM ? (
                    <>
                      <b>Final Exam</b> |{' '}
                      {`${time.start.format('h:mm')}-${time.end.format(
                        'h:mm a'
                      )} | ${meeting.location} | ${meeting.startDate.format(
                        'MMM D'
                      )}`}
                    </>
                  ) : (
                    `${time.start.format('h:mm')}-${time.end.format(
                      'h:mm a'
                    )} | ${meeting.location}`
                  )}
                </span>
                <br />
              </>
            ))}
          </div>
        </div>
      );
      // eslint-disable-next-line react/prop-types
    }
    if (section.meetings.length <= 1) {
      return <span>See syllabus</span>;
    }
    return null;
  };

  const getMeetings = (s: Section): ReactElement[] => {
    // Class meeting times should always come before Final Exam times
    s.meetings.sort((a) => (a.type === MeetingType.CLASS ? -1 : 1));
    return s.meetings.map((m) => {
      const meetingDays = Array(7).fill(false);
      meetingDays.forEach((d, index) => {
        if (meetsOnDay(m, index)) meetingDays[index] = true;
      });
      return singleMeeting(meetingDays, m);
    });
  };

  // Prevents rerendering when section toggle is switched on the notifications page
  const DesktopMeetingsComponent = (s: Section): ReactElement[] => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => getMeetings(s), []);
  };

  const checked =
    userInfo && userInfo.sectionIds.includes(Keys.getSectionHash(section));

  return (
    <tr className="DesktopSectionPanel" key={Keys.getSectionHash(section)}>
      <td>
        <a href={section.url} target="_blank" rel="noopener noreferrer">
          {section.crn}
        </a>
        <Tooltip
          text={'View this section on Banner.'}
          direction={TooltipDirection.Up}
        />
        {section.honors ? (
          <i>
            <br />
            Honors
          </i>
        ) : (
          ''
        )}
      </td>
      <td>{getProfs(section).join(', ')}</td>
      <td>
        {section.online ? (
          <span>Online Class</span>
        ) : (
          DesktopMeetingsComponent(section)
        )}
      </td>
      <td>{section.campus}</td>
      <td>
        <div className="DeskopSectionPanel__seatcount">
          <span className={'DesktopSectionPanel__' + getSeatsClass()}>
            {section.seatsRemaining}/{section.seatsCapacity}
          </span>
          {section.seatsRemaining < 0 && (
            <InfoIconTooltip
              text={negTooltipText}
              direction={TooltipDirection.Down}
              flipLeft={true}
            />
          )}
        </div>
        <span>
          {`${section.waitRemaining}/${section.waitCapacity} Waitlist Seats`}
        </span>
      </td>
      {userInfo && (
        <td>
          <div className="DesktopSectionPanel__notifs">
            <SectionCheckBox
              section={section}
              checked={checked}
              userInfo={userInfo}
              fetchUserInfo={fetchUserInfo}
            />
          </div>
        </td>
      )}
    </tr>
  );
}

export function MobileSectionPanel({
  section,
  userInfo,
  fetchUserInfo,
}: MobileSectionPanelProps): ReactElement {
  const { getSeatsClass } = useSectionPanelDetail(
    section.seatsRemaining,
    section.seatsCapacity
  );

  const groupedTimesAndDays = (times: DayjsTuple[]): Map<string, string[]> => {
    const daysOfWeek = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
    return times.reduce((acc, t) => {
      const timeString = `${t.start.format('h:mm')}-${t.end.format('h:mm a')}`;
      acc.set(
        timeString,
        acc.get(timeString)
          ? acc.get(timeString) + daysOfWeek[t.start.day()]
          : daysOfWeek[t.start.day()]
      );

      return acc;
    }, new Map());
  };

  const getMeetings = (s: Section): ReactElement[][] => {
    // Mobile only displays class times, no final exams
    const classMeetings = s.meetings.filter(
      (m) => m.type === MeetingType.CLASS
    );
    return classMeetings.map((m) =>
      Array.from(groupedTimesAndDays(m.times)).map(([time, days]) => (
        <>
          <span className="MobileSectionPanel__meetings--time">
            {`${days}, ${time} | ${m.location}`}
          </span>
          <br />
        </>
      ))
    );
  };

  const checked =
    userInfo && userInfo.sectionIds.includes(Keys.getSectionHash(section));

  return (
    <div className="MobileSectionPanel">
      <div className="MobileSectionPanel__header">
        <span>{getProfs(section).join(', ')}</span>
        <span>{section.campus}</span>
      </div>
      <div className="MobileSectionPanel__firstRow">
        <div>
          <a target="_blank" rel="noopener noreferrer" href={section.url}>
            <IconGlobe />
          </a>
          <span>
            {section.crn}
            {section.honors ? <i>&nbsp;&nbsp;&nbsp;Honors</i> : ''}
          </span>
        </div>
      </div>
      <div className="MobileSectionPanel__row">
        {!section.online && (
          <WeekdayBoxes
            meetingDays={getDaysOfWeekAsBooleans(section)}
            meetingType={MeetingType.CLASS}
          />
        )}
      </div>
      <div className="MobileSectionPanel__meetings">
        {section.online ? (
          <span className="MobileSectionPanel__meetings--online">
            Online Class
          </span>
        ) : (
          getMeetings(section)
        )}
      </div>
      <div className="MobileSectionPanel__row">
        <div className={getSeatsClass()}>
          <span>{`${section.seatsRemaining}/${section.seatsCapacity} Seats Available`}</span>
          <span> | </span>
          <span className="MobileSectionPanel__waitlist-text">
            {`${section.waitRemaining}/${section.waitCapacity} Waitlist Seats`}
          </span>
          {section.seatsRemaining < 0 && (
            <InfoIconTooltip
              text={negTooltipText}
              direction={TooltipDirection.Down}
              flipLeft={false}
            />
          )}
        </div>

        {userInfo && (
          <SectionCheckBox
            section={section}
            checked={checked}
            userInfo={userInfo}
            fetchUserInfo={fetchUserInfo}
          />
        )}
      </div>
    </div>
  );
}
