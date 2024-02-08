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
      <div className="SearchResult__panel">{body}</div>
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
  const [hideSections, setHideSections] = useState(true);

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
      afterBody={
        <>
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
              {!hideSections &&
                sectionsFormatted.map((section) => (
                  <DesktopSectionPanel
                    key={section.crn}
                    section={section}
                    userInfo={userInfo}
                    fetchUserInfo={fetchUserInfo}
                  />
                ))}
            </tbody>
          </table>
          <div
            className="SearchResult__showAll"
            role="button"
            tabIndex={0}
            onClick={() => setHideSections(!hideSections)}
          >
            <span>{hideSections ? 'Show sections' : 'Hide sections'}</span>
            <DropdownArrow
              style={{ marginTop: 3 }}
              className={
                !hideSections ? 'SearchResult__showAll--collapse' : null
              }
            />
          </div>
        </>
      }
    />
  );
};
