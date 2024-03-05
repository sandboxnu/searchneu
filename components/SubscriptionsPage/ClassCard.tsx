import { ReactElement, useState } from 'react';
import { Section, UserInfo } from '../types';
import { LastUpdated } from '../common/LastUpdated';
import { DesktopSectionPanel } from '../ResultsPage/Results/SectionPanel';
import { getFormattedSections } from '../ResultsPage/ResultsLoader';
import DropdownArrow from '../icons/DropdownArrow.svg';

type ClassCardWrapperType = {
  headerLeft: ReactElement;
  headerRight?: ReactElement;
  body?: ReactElement;
  afterBody?: ReactElement;
};

const ClassCardWrapper = ({
  headerLeft,
  headerRight,
  body,
  afterBody,
}: ClassCardWrapperType): ReactElement => {
  return (
    <div className="SearchResult">
      <div className="SearchResult__header">
        <div className="SearchResult__header--left">{headerLeft}</div>
        {headerRight}
      </div>
      {body}
      {afterBody}
    </div>
  );
};

type ClassCardType = {
  course: {
    subject: string;
    classId: string;
    name: string;
    host: string;
    lastUpdateTime: number;
  };
  sections: Section[];
  userInfo: UserInfo;
  fetchUserInfo: () => void;
};

export const ClassCard = ({
  course,
  sections,
  userInfo,
  fetchUserInfo,
}: ClassCardType): ReactElement => {
  const sectionsFormatted: Section[] = getFormattedSections(sections);
  const [areSectionsHidden, setAreSectionsHidden] = useState(true);

  return (
    <ClassCardWrapper
      headerLeft={
        <>
          <span className="SearchResult__header--classTitle">
            {course.subject} {course.classId}: {course.name}
          </span>
          <LastUpdated
            host={course.host}
            prettyUrl={''} //Ignore this for now, the current link we use is outdated anyway. Will need to be course.prettyUrl
            lastUpdateTime={course.lastUpdateTime}
            className="SearchResult__header--sub"
          />
        </>
      }
      headerRight={<button>Unsubscribe</button>}
      body={
        <>
          <div style={{ display: areSectionsHidden ? 'none' : 'block' }}>
            <table className="SearchResult__sectionTable">
              <thead>
                <tr>
                  <th>
                    <div
                      className="inlineBlock"
                      data-tip="Course Reference Number"
                    >
                      CRN
                    </div>
                  </th>
                  <th> Professors </th>
                  <th> Meetings </th>
                  <th> Campus </th>
                  <th> Seats </th>
                  {userInfo && <th> Notifications </th>}
                </tr>
              </thead>
              <tbody>
                {sectionsFormatted.map((section) => (
                  <DesktopSectionPanel
                    key={section.crn}
                    section={section}
                    userInfo={userInfo}
                    fetchUserInfo={fetchUserInfo}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      }
      afterBody={
        <>
          <div
            className={
              areSectionsHidden
                ? 'SearchResult__showAll--subscriptionButton'
                : 'SearchResult__showAll'
            }
            role="button"
            tabIndex={0}
            onClick={() => setAreSectionsHidden(!areSectionsHidden)}
          >
            <span>{areSectionsHidden ? 'Show sections' : 'Hide sections'}</span>
            <DropdownArrow
              className={
                areSectionsHidden
                  ? 'SearchResult__showAll--subscriptionCollapsed'
                  : 'SearchResult__showAll--subscriptionExpanded'
              }
            />
          </div>
        </>
      }
    />
  );
};
