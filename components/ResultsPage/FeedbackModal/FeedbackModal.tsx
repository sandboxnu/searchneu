import React, { ReactElement, useRef, useState } from 'react';
import SmallSearchLogo from '../../icons/faviconsearchingSmall.svg';
import macros from '../../macros';
import useClickOutside from '../useClickOutside';
import useFeedbackSchedule from '../useFeedbackSchedule';
import FeedbackModalCheckboxes from './FeedbackModalCheckboxes';
import FeedbackModalFree from './FeedbackModalFree';
import FeedbackModalInitial from './FeedbackModalInitial';
import Colors from '../../../styles/_exports.module.scss';

enum FeedbackStep {
  initial,
  checkbox,
  free,
}

export default function FeedbackModal(): ReactElement {
  const [open, setOpen] = useState(false);
  const [yes, setYes] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState([]);
  const [feedbackQuery, setFeedbackQuery] = useState('');
  const [feedbackType, setFeedbackType] = useState('filter');
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(FeedbackStep.initial);

  const modalRef = useRef(null);
  useClickOutside(modalRef, open, setOpen);

  const keyString = 'MODAL';
  const [show, setFinished] = useFeedbackSchedule(keyString, 86400000);

  const feedbackOptions = [
    'Class time',
    'Professor',
    'Prereqs',
    'Something else',
  ];

  function handleSubmit(): void {
    switch (step) {
      case FeedbackStep.initial:
        if (yes) {
          macros.logAmplitudeEvent('Feedback modal initial submit', {
            lookingForFound: yes,
          });
          setSubmitted(true);
          setFinished();
        } else {
          macros.logAmplitudeEvent('Feedback modal initial submit', {
            lookingForFound: yes,
          });
          setStep(FeedbackStep.checkbox);
        }
        break;
      case FeedbackStep.checkbox:
        macros.logAmplitudeEvent('Feedback modal checkbox submit', {
          lookingFor: selectedFeedback,
        });
        setStep(FeedbackStep.free);
        break;
      case FeedbackStep.free:
        macros.logAmplitudeEvent('Feedback modal free submit', {
          feedbackType: feedbackType,
          feedbackQuery: feedbackQuery,
        });
        setSubmitted(true);
        setFinished();
        break;
      default:
        break;
    }
  }

  function buttonText(): string {
    if (yes && submitted) {
      return 'HOLLA HOLLA';
    }
    if (submitted) {
      return 'THANK YOU!';
    }
    return 'SEND FEEDBACK';
  }

  function renderFeedback(): ReactElement {
    switch (step) {
      case FeedbackStep.initial:
        return <FeedbackModalInitial setYes={setYes} />;
      case FeedbackStep.checkbox:
        return (
          <FeedbackModalCheckboxes
            feedbackOptions={feedbackOptions}
            selectedFeedback={selectedFeedback}
            setSelectedFeedback={setSelectedFeedback}
          />
        );
      case FeedbackStep.free:
        return (
          <FeedbackModalFree
            feedbackQuery={feedbackQuery}
            setFeedbackQuery={setFeedbackQuery}
            setFeedbackType={setFeedbackType}
          />
        );
      default:
        return null;
    }
  }

  return (
    show && (
      <div ref={modalRef} className="FeedbackModal">
        {open && (
          <div className="FeedbackModal__popout">
            <div className="FeedbackModal__popoutHeader">
              <p>SearchNEU Feedback</p>
            </div>
            {renderFeedback()}
            <div
              className={
                !submitted
                  ? 'FeedbackModal__submit'
                  : 'FeedbackModal__submit--submitted'
              }
              role="button"
              tabIndex={0}
              onClick={handleSubmit}
            >
              <p>{buttonText()}</p>
            </div>
          </div>
        )}
        <div
          className="FeedbackModal__pill"
          role="button"
          tabIndex={0}
          onClick={() => {
            setOpen(!open);
          }}
        >
          <SmallSearchLogo height="14" width="18" fill={Colors.neu_red} />
          <p>SearchNEU Feedback</p>
        </div>
      </div>
    )
  );
}
