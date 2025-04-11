import { ReactElement, useState } from 'react';
import { Section, SubscriptionCourse, UserInfo } from '../types';
import { LastUpdated } from '../common/LastUpdated';
import { DesktopSectionPanel } from '../ResultsPage/Results/SectionPanel';
import { getFormattedSections } from '../ResultsPage/ResultsLoader';
import DropdownArrow from '../icons/DropdownArrow.svg';
import IconCollapseExpand from '../icons/IconCollapseExpand';
import CourseCheckBox from '../panels/CourseCheckBox';
import { CRNBadge } from './CRNBadge';
import axios from 'axios';
import Keys from '../Keys';

type ClassCardWrapperType = {
  headerLeft: ReactElement;
  headerRight?: ReactElement;
  body?: ReactElement;
  afterBody?: ReactElement;
};

export const ClassCardWrapper = ({
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
  course: SubscriptionCourse;
  sections: Section[];
  userInfo: UserInfo;
  fetchUserInfo: () => void;
  onSignIn: (token: string) => void;
};

export function ClassCard({
  course,
  sections,
  userInfo,
  fetchUserInfo,
  onSignIn,
}: ClassCardType): ReactElement {
  const sectionsFormatted: Section[] = getFormattedSections(sections);
  const [areSectionsHidden, setAreSectionsHidden] = useState(true);

  const hasAtLeastOneSectionFull = (): boolean => {
    return course.sections.some((e) => {
      return e.seatsRemaining <= 0 && e.seatsCapacity > 0;
    });
  };

  const unsubscribeAll = () => {
    axios
      .delete(`${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/user/subscriptions`, {
        data: {
          token: userInfo.token,
          sectionIds: sections.map((s) => Keys.getSectionHash(s)),
          courseIds: [Keys.getClassHash(course)],
        },
      })
      .then(() => fetchUserInfo());
  };

  return (
    <ClassCardWrapper
      headerLeft={
        // ask Nick what this is and if this makes me not have to div --left
        <>
          <span className="SearchResult__header--classTitle">
            {course.subject} {course.classId}: {course.name}
          </span>
          {/* <LastUpdated
            lastUpdateTime={course.lastUpdateTime}
            className="SearchResult__header--sub"
          />  */}
          <div className="SearchResult__header--sub">
            {sectionsFormatted.map((section) => (
              <CRNBadge
                key={section.crn}
                userInfo={userInfo}
                crn={section.crn}
              ></CRNBadge>
            ))}
          </div>
        </>
      }
      headerRight={
        <div
          className="SearchResult__showAll"
          onClick={() => setAreSectionsHidden(!areSectionsHidden)}
          style={{
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <IconCollapseExpand
            className={
              areSectionsHidden
                ? 'SearchResult__showAll--subscriptionCollapsed'
                : 'SearchResult__showAll--subscriptionExpanded'
            }
          />
        </div>
      }
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
                  <th> Notifications </th>
                </tr>
              </thead>
              <tbody>
                {sectionsFormatted.map((section) => (
                  <DesktopSectionPanel
                    key={section.crn}
                    section={section}
                    userInfo={userInfo}
                    fetchUserInfo={fetchUserInfo}
                    // We don't really have access to onSignIn until header is added to the subscription page. Passing in a fake onSignIn
                    onSignIn={onSignIn}
                  />
                ))}
              </tbody>
              {hasAtLeastOneSectionFull() && (
                <tfoot>
                  <tr>
                    <td colSpan={5}>New available sections</td>
                    <td>
                      <div className="DesktopSectionPanel__notifs">
                        <CourseCheckBox
                          course={course}
                          userInfo={userInfo}
                          fetchUserInfo={fetchUserInfo}
                          onSignIn={onSignIn}
                        />
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      }
      afterBody={
        !areSectionsHidden && (
          <>
            <div
              className={
                areSectionsHidden
                  ? 'SearchResult__showAll--subscriptionButton'
                  : 'SearchResult__showAll'
              }
              role="button"
              tabIndex={0}
            >
              <button
                className={'SearchResult__showAll--unsubscribeButton'}
                onClick={unsubscribeAll}
              >
                Unsubscribe All
              </button>
            </div>
          </>
        )
      }
    />
  );
}
