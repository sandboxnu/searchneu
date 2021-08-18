import React, { ReactElement } from 'react';
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
import NotifCheckBox from '../../panels/NotifCheckBox';
import NotifSignUpButton from './NotifSignUpButton';
import { useState } from 'react';
import { Modal, Input, Typography, Button } from 'antd';
import axios from 'axios';
import { BarLoader } from 'react-spinners';
import { UserInfo } from '../../Header';

interface SectionPanelProps {
  section: Section;
  showNotificationSwitches: boolean;
  userInfo: UserInfo;
  onSignIn: (token: string) => void;
  fetchUserInfo: () => void;
  showNotificationSignup: boolean;
}

interface MobileSectionPanelProps {
  section: Section;
  showNotificationSwitches: boolean;
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
  showNotificationSwitches,
  userInfo,
  onSignIn,
  fetchUserInfo,
  showNotificationSignup,
}: SectionPanelProps): ReactElement {
  const [showModal, setShowModal] = useState(false);
  const [modalCountryCode, setModalCountryCode] = useState('1');
  const [modalPhoneNumber, setModalPhoneNumber] = useState('');
  const [modalSubmitted, setModalSubmitted] = useState(false);
  const [modalResendDisabled, setModalResendDisabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [
    modalPhoneValidationMessage,
    setModalPhoneValidationMessage,
  ] = useState('');
  const [modalResponseMessage, setModalResponseMessage] = useState('');

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

  const onNotifSignUp = (): void => {
    setShowModal(true);
  };

  const onPhoneNumberSubmit = (): void => {
    axios
      .post(`http://localhost:8080/sms/signup`, {
        phoneNumber: `+${modalCountryCode}${modalPhoneNumber}`,
      })
      .then(() => {
        setModalPhoneValidationMessage('');
        if (!modalSubmitted) setModalSubmitted(true);
        setModalResendDisabled(true);
        setTimeout(() => setModalResendDisabled(false), 30 * 1000);
      })
      .catch((error) => {
        setModalPhoneValidationMessage(
          'Unable to send text, please check that your phone number is formatted correctly'
        );
      });
  };

  const onVerificationCodeSubmit = (): void => {
    setModalLoading(true);
    setModalResponseMessage('');
    axios
      .post(`http://localhost:8080/sms/verify`, {
        phoneNumber: `+${modalCountryCode}${modalPhoneNumber}`,
        verificationCode,
      })
      .then(({ status, data }) => {
        setModalLoading(false);
        setShowModal(false);
        onSignIn(data.token);
      })
      .catch((error) => {
        setModalLoading(false);
        setModalResponseMessage(
          'Error: Please try again or request a new verification code.'
        );
      });
  };

  const onModalCancel = (): void => {
    setShowModal(false);
    setModalResendDisabled(false);
    setModalSubmitted(false);
  };

  const onCountryCodeChange = (value: any): void => {
    const reg = /^\d*$/;
    if (!isNaN(value) && reg.test(value)) {
      setModalCountryCode(value);
    }
  };

  const onPhoneChange = (value: any): void => {
    const reg = /^\d*$/;
    if (!isNaN(value) && reg.test(value)) {
      setModalPhoneNumber(value);
    }
  };

  const onVerificationCodeChange = (value: any): void => {
    const reg = /^\d*$/;
    if (!isNaN(value) && reg.test(value)) {
      setVerificationCode(value);
    }
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
      </td>
      <td>{getProfs(section).join(', ')}</td>
      <td>
        {section.online ? <span>Online Class</span> : getMeetings(section)}
      </td>
      <td>{section.campus}</td>
      <td>
        <span className={getSeatsClass()}>
          {section.seatsRemaining}/{section.seatsCapacity}
        </span>
        <br />
        <span>
          {`${section.waitRemaining}/${section.waitCapacity} Waitlist Seats`}
        </span>
      </td>
      {userInfo ? (
        <td>
          <div className="DesktopSectionPanel__notifs">
            <NotifCheckBox
              section={section}
              checked={checked}
              userInfo={userInfo}
              fetchUserInfo={fetchUserInfo}
            />
          </div>
        </td>
      ) : (
        showNotificationSignup && (
          <td>
            <NotifSignUpButton onNotifSignUp={onNotifSignUp} />
          </td>
        )
      )}
      <Modal
        visible={showModal}
        title="Sign up for SMS notifications!"
        onCancel={onModalCancel}
        footer={[
          <Button
            key="send code"
            onClick={onPhoneNumberSubmit}
            disabled={modalResendDisabled}
          >
            {modalSubmitted
              ? 'Send New Verification Text'
              : 'Send Verification Text'}
          </Button>,
          <Button
            key="enter code"
            type="primary"
            onClick={onVerificationCodeSubmit}
            disabled={!modalSubmitted}
          >
            Enter Code
          </Button>,
        ]}
      >
        <Typography.Text>Enter your phone #:</Typography.Text>
        <br />
        <Input.Group compact>
          <Input
            style={{ width: '15%' }}
            prefix="+"
            value={modalCountryCode}
            onChange={({ target }) => onCountryCodeChange(target.value)}
          />
          <Input
            style={{ width: '85%' }}
            placeholder="1234567890"
            maxLength={10}
            value={modalPhoneNumber}
            onChange={({ target }) => onPhoneChange(target.value)}
          />
        </Input.Group>
        {modalPhoneValidationMessage && (
          <span style={{ color: 'red' }}>{modalPhoneValidationMessage}</span>
        )}
        {modalSubmitted && (
          <>
            <span>
              Verification code sent to +{modalCountryCode}
              {modalPhoneNumber}
            </span>
            <br />
            <br />
            <span>Enter verification code below:</span>
            <Input
              placeholder="123456"
              maxLength={6}
              value={verificationCode}
              onChange={({ target }) => onVerificationCodeChange(target.value)}
            />
          </>
        )}
        <br />
        <br />
        <BarLoader
          css="display: block"
          loading={modalLoading}
          width={'100%'}
          color={'#E63946'}
        />
        {modalResponseMessage && <span>{modalResponseMessage}</span>}
      </Modal>
    </tr>
  );
}

export function MobileSectionPanel({
  section,
  showNotificationSwitches,
}: MobileSectionPanelProps): ReactElement {
  // TODO: remove when notifications is fixed
  showNotificationSwitches = false;

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

  return (
    <div className="MobileSectionPanel">
      <div className="MobileSectionPanel__header">
        <span>{getProfs(section).join(', ')}</span>
        <span>Boston</span>
      </div>
      <div className="MobileSectionPanel__firstRow">
        <div>
          <a target="_blank" rel="noopener noreferrer" href={section.url}>
            <IconGlobe />
          </a>
          <span>{section.crn}</span>
        </div>
        {showNotificationSwitches && (
          <NotifCheckBox
            section={section}
            checked={false}
            userInfo={null}
            fetchUserInfo={null}
          />
        )}
      </div>
      <div className="MobileSectionPanel__secondRow">
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
      <div className={getSeatsClass()}>
        {`${section.seatsRemaining}/${section.seatsCapacity} Seats Available `}
      </div>
    </div>
  );
}
