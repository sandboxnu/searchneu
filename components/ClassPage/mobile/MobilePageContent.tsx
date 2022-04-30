import { Markup } from 'interweave';
import { mean } from 'lodash';
import React, { ReactElement, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Dropdown } from 'semantic-ui-react';
import IconCollapseExpand from '../../icons/IconCollapseExpand';
import IconArrow from '../../icons/IconArrow';
import { PageContentProps } from '../PageContent';
import { getLastUpdateString } from '../../common/LastUpdated';
import { creditsNumericDisplay } from '../../common/CreditsDisplay';
import { Campus } from '../../types';
import IconGradcap from '../../icons/IconGradcap';
import IconScale from '../../icons/IconScale';
import IconTie from '../../icons/IconTie';
import IconDollarSign from '../../icons/IconDollarSign';
import {
  numberOfSections,
  seatsAvailable,
  seatsFilled,
} from '../ClassPageInfoBody';
import Expandable, { SupportedInfoTypes } from './MobileClassInfoExpandable';
import IconGlobe from '../../icons/IconGlobe';
import IconMessage from '../../icons/IconMessage';
import SignUpForNotifications from '../../SignUpForNotifications';
import {
  ClassPageSection,
  getCampusOptions,
  splitMeetingsAndExamTimes,
  getDaysOfWeekAsBooleans,
  displayCourseMeetingTimes,
  displayFinalExamDate,
  displayFinalExamTimes,
} from '../ClassPageSections';
import { getSeason, getYear } from '../../terms';
import WeekdayBoxes from '../../ResultsPage/Results/WeekdayBoxes';
import useSectionPanelDetail from '../../ResultsPage/Results/useSectionPanelDetail';

export default function MobilePageContent({
  termId,
  campus,
  subject,
  classId,
  classPageInfo,
  isCoreq,
}: PageContentProps): ReactElement {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [sectionsExpanded, setSectionsExpanded] = useState(true);

  // states related to sections
  const [currTermIndex, setCurrTermIndex] = useState(0);
  const [sectionCampuses, setSectionCampuses] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState('');
  const [sections, setSections] = useState<ClassPageSection[]>([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(termId);

  useEffect(() => {
    if (classPageInfo && classPageInfo.class) {
      setSectionCampuses(getCampusOptions(currTermIndex, classPageInfo));
    }
  }, [currTermIndex, classPageInfo]);

  useEffect(() => {
    if (classPageInfo && classPageInfo.class) {
      const tempSems = [];
      classPageInfo.class.allOccurrences.forEach((occurrence) =>
        tempSems.push(occurrence.termId)
      );
      setSemesters(tempSems);
    }
  }, [classPageInfo]);

  useEffect(() => {
    if (sectionCampuses) {
      setSelectedCampus(sectionCampuses[0]);
    }
  }, [sectionCampuses]);

  useEffect(() => {
    if (classPageInfo && classPageInfo.class) {
      setSections(
        classPageInfo.class.allOccurrences[currTermIndex].sections.filter(
          (section) => section.campus === selectedCampus
        )
      );
    }
  }, [currTermIndex, selectedCampus, classPageInfo]);

  return (
    <div className="mobilePageContent">
      <div className="backToResults" onClick={() => router.back()}>
        {'< Back to Search Results'}
      </div>

      {classPageInfo && classPageInfo.class && (
        <div className="classPageContainer">
          <div
            className={
              expanded
                ? 'classPageContainer__header--expanded'
                : 'classPageContainer__header'
            }
            role="button"
            tabIndex={0}
            onClick={() => setExpanded(!expanded)}
          >
            <IconCollapseExpand />
            <span className="classPageContainer__header--classTitle">
              {`${subject}${classId}: ${classPageInfo.class.name}`}
            </span>
          </div>

          {expanded && (
            <div className="panel">
              <div className="panel__classInfo">
                <div className="updateCreditPanel">
                  <div className="lastUpdated">
                    {`Updated ${getLastUpdateString(
                      classPageInfo.class.latestOccurrence.lastUpdateTime
                    )}`}
                  </div>
                  <div className="creditsDisplay">
                    <span className="creditsNumericDisplay">
                      {creditsNumericDisplay(
                        classPageInfo.class.latestOccurrence.maxCredits,
                        classPageInfo.class.latestOccurrence.minCredits
                      )}
                    </span>
                    {classPageInfo.class.latestOccurrence.maxCredits === 1
                      ? ' Credit'
                      : ' Credits'}
                  </div>
                </div>

                <div
                  className={
                    showMore
                      ? 'panel__classInfo--description'
                      : 'panel__classInfo--descriptionHidden'
                  }
                >
                  <Markup content={classPageInfo.class.latestOccurrence.desc} />
                </div>
                <div
                  className="panel__classInfo--showMore"
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowMore(!showMore)}
                >
                  {showMore ? 'Show less' : 'Show more'}
                </div>

                <div className="courseLevel">
                  {campus === Campus.NEU ? (
                    <IconGradcap />
                  ) : campus === Campus.CPS ? (
                    <IconTie />
                  ) : (
                    <IconScale />
                  )}
                  <span className="courseLevelText">
                    {`${
                      campus === Campus.NEU ? 'Undergraduate' : 'Graduate'
                    } Course Level`}
                  </span>
                </div>

                <div className="courseFees">
                  {classPageInfo.class.latestOccurrence.feeAmount && (
                    <>
                      <IconDollarSign />
                      <span className="courseFeesText">
                        {`Course Fees: $${classPageInfo.class.latestOccurrence.feeAmount.toLocaleString()}`}
                      </span>
                    </>
                  )}
                </div>

                <div className="avgInfo">
                  <p>In this course, there is, on average:</p>
                  <ul>
                    <li>
                      <b>{Math.round(mean(numberOfSections(classPageInfo)))}</b>{' '}
                      sections
                    </li>
                    <li>
                      <b>{Math.round(mean(seatsAvailable(classPageInfo)))}</b>{' '}
                      seats per section
                    </li>
                    <li>
                      <b>{Math.round(mean(seatsFilled(classPageInfo)))}</b>{' '}
                      seats filled, or{' '}
                      <b>
                        {(
                          Math.round(mean(seatsFilled(classPageInfo))) /
                          Math.round(mean(seatsAvailable(classPageInfo)))
                        ).toFixed(1)}
                        %
                      </b>{' '}
                      of seats per section filled.
                    </li>
                  </ul>
                </div>

                <div className="expandables">
                  {Object.values(SupportedInfoTypes).map((type, index) => (
                    <div key={`expandable${index}`}>
                      <Expandable
                        type={type}
                        classPageInfo={classPageInfo}
                        termId={termId}
                        campus={campus}
                      />
                    </div>
                  ))}
                </div>

                <div className="bannerButton">
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={classPageInfo.class.latestOccurrence.prettyUrl}
                    className="bannerPageLink"
                  >
                    <IconGlobe width="22" height="22" className="globe-icon" />
                    <span>View the course on Banner</span>
                  </a>
                </div>

                <div className="notifyButton">
                  {/* <SignUpForNotifications
                    course={classPageInfo.class.latestOccurrence}
                    userInfo={userInfo}
                    onSignIn={onSignIn}
                    showNotificationSignup={false}
                    fetchUserInfo={fetchUserInfo}
                  /> */}
                  <IconMessage className="message-icon" />
                  <span>Notify me when seats open!</span>
                </div>
              </div>

              {/* Section Information */}
              <div className="sections">
                {sectionsExpanded && (
                  <div className="sections--expanded">
                    <div className="header">{`Viewing ${subject}${classId} sections for:`}</div>
                    <div className="campus">
                      <b>Campus:</b> <br />
                      <Dropdown
                        selection
                        text={selectedCampus || ''}
                        className="sectionsCampusDropdown"
                      >
                        <Dropdown.Menu className="sectionsCampusDropdownMenu">
                          {sectionCampuses.map((campus) => (
                            <Dropdown.Item
                              className={'sectionsCampusOption'}
                              value={campus}
                              text={campus}
                              selected={campus === selectedCampus}
                              onClick={() => setSelectedCampus(campus)}
                              key={campus}
                            ></Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div className="semester">
                      <b>Semester:</b> <br />
                      <Dropdown
                        selection
                        text={
                          `${getSeason(`${selectedSemester}`)} ${getYear(
                            `${selectedSemester}`
                          )}` || ''
                        }
                        className="sectionsSemesterDropdown"
                      >
                        <Dropdown.Menu className="sectionsSemesterDropdownMenu">
                          {semesters.map((semester, index) => {
                            if (
                              classPageInfo.class.allOccurrences[index] &&
                              classPageInfo.class.allOccurrences[index].sections
                            ) {
                              return (
                                <Dropdown.Item
                                  className={'sectionsSemesterOption'}
                                  value={index}
                                  text={`${getSeason(`${semester}`)} ${getYear(
                                    `${semester}`
                                  )}`}
                                  selected={semester === termId}
                                  onClick={() => {
                                    setSelectedSemester(semester);
                                    setCurrTermIndex(index);
                                  }}
                                  key={campus}
                                ></Dropdown.Item>
                              );
                            }
                          })}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    {sections.map((section, index) => {
                      if (section.campus === selectedCampus) {
                        return (
                          <div key={`sectionCard${index}`}>
                            <MobileSectionCard section={section} />
                            {index < sections.length - 1 && (
                              <div className="horizontalLine"></div>
                            )}
                          </div>
                        );
                      } else {
                        return <div key={`sectionCard${index}`}></div>;
                      }
                    })}
                  </div>
                )}
                <div
                  className="sections--toggle"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSectionsExpanded(!sectionsExpanded)}
                >
                  {sectionsExpanded ? (
                    <>
                      <b>Collapse all sections</b>
                      <IconArrow className="arrow-left" />
                    </>
                  ) : (
                    <>
                      <b>Show all sections</b>
                      <IconArrow className="arrow-right" />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type MobileSectionCardProps = {
  section: ClassPageSection;
};

const MobileSectionCard = ({
  section,
}: MobileSectionCardProps): ReactElement => {
  const { getSeatsClass } = useSectionPanelDetail(
    section.seatsRemaining,
    section.seatsCapacity
  );
  const [classMeetings, finalExamMeeting] = splitMeetingsAndExamTimes(
    section.meetings
  );
  return (
    <div className="mobileSectionCard">
      <div className="sectionProfCampusFlex">
        <div className="sectionProfs">{section.profs.join(', ')}</div>
        <div className="sectionCampus">{section.campus}</div>
      </div>

      <div className="sectionCRN">
        {'CRN: '}
        <a href={section.url}>{`${section.crn}`}</a>
      </div>

      <div className="sectionMeetings">
        {classMeetings.map((meeting, index) => (
          <div key={`meeting${index}`}>
            <WeekdayBoxes
              meetingDays={getDaysOfWeekAsBooleans(meeting)}
              meetingType={meeting.type}
            />
            <div className="meetingTimeAndLocation">{`${displayCourseMeetingTimes(
              meeting
            )} | ${meeting.where}`}</div>
          </div>
        ))}
      </div>

      <div className="sectionFinalExam">
        {finalExamMeeting.map((meeting, index) => (
          <div key={`finalExam${index}`}>
            {`Final Exam: 
            ${displayFinalExamDate(meeting)} | 
            ${displayFinalExamTimes(meeting)} | 
            ${meeting.where}`}
          </div>
        ))}
      </div>

      <div className={`seatsAvailable ${getSeatsClass()}`}>
        {`${section.seatsRemaining}/${section.seatsCapacity} Seats Available `}
      </div>
    </div>
  );
};
