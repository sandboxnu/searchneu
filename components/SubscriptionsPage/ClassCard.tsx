import { ReactElement, useState } from 'react';
import { Section, SubscriptionCourse, UserInfo } from '../types';
import { DesktopSectionPanel } from '../ResultsPage/Results/SectionPanel';
import { getFormattedSections } from '../ResultsPage/ResultsLoader';
import { ButtonContent, Button, Icon } from 'semantic-ui-react';
import NotifPill from './NotifPill';
import Toggle from '../common/Toggle';

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
    <div className="SubscriptionResult">
      <div className="SubscriptionResult__header">
        <div className="SubscriptionResult__header--left">{headerLeft}</div>
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

export const ClassCard = ({
  course,
  sections,
  userInfo,
  fetchUserInfo,
  onSignIn,
}: ClassCardType): ReactElement => {
  const sectionsFormatted: Section[] = getFormattedSections(sections);
  const [areSectionsHidden, setAreSectionsHidden] = useState(true);

  const toggleHiddenSections = () => {
    setAreSectionsHidden(!areSectionsHidden);
  };

  const userInfoIds = userInfo.sectionIds.map((hash) => {
    const h = hash.split('/');
    return h[h.length - 1];
  });
  const notifPills: Array<ReactElement> = [];

  for (const section of sections) {
    if (userInfoIds.includes(section.crn)) {
      notifPills.push(
        <NotifPill key={section.crn} active={true} CRN={section.crn} />
      );
    }
  }

  return (
    <ClassCardWrapper
      headerLeft={
        <>
          <span className="SubscriptionResult__header--classTitle">
            {course.subject} {course.classId}: {course.name}
          </span>
          <div className="SubscriptionResult__header--pills">{notifPills}</div>
        </>
      }
      headerRight={
        areSectionsHidden ? (
          <Icon
            name="chevron down"
            size="large"
            onClick={toggleHiddenSections}
            style={{ cursor: 'pointer' }}
          />
        ) : (
          <Icon
            name="chevron up"
            size="large"
            onClick={toggleHiddenSections}
            style={{ cursor: 'pointer' }}
          />
        )
      }
      body={
        <>
          <div style={{ display: areSectionsHidden ? 'none' : 'block' }}>
            <table className="SubscriptionResult__sectionTable">
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
              <tfoot>
                <tr>
                  <td colSpan={6}>
                    <div className="SubscriptionResult__sectionTable__deleteRow">
                      <Button
                        animated
                        size="mini"
                        className="SubscriptionResult__sectionTable__deleteRow__button"
                      >
                        <ButtonContent visible>Delete Class</ButtonContent>
                        <ButtonContent hidden>
                          <Icon name="trash" />
                        </ButtonContent>
                      </Button>
                    </div>
                  </td>
                </tr>
              </tfoot>
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
            </table>
          </div>
        </>
      }
      afterBody={<></>}
    />
  );
};
