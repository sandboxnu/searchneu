/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React, { ReactElement, useEffect, useState } from 'react';
import { Transition } from 'react-transition-group';

import {
  Button,
  Icon,
  Modal,
  Header,
  TextArea,
  Input,
  Form,
  Message,
} from 'semantic-ui-react';

import macros from './macros';
import axios from 'axios';

// This file manages the two popups that asks for user information
// 1. the feedback popup that shows up if you click the feedback button on the bottom of the page
// 2. At one point, instead of the typeform, we had a similar popup appear asking if user's were interested
// These popups display a messge and have a a text box for users to enter data, and then they sent this data to the backend
type State = {
  messageValue: string;
  contactValue: string;
  sending: boolean;
  messageVisible: boolean;
};

type Props = {
  toggleForm: () => void;
  feedbackModalOpen: boolean;
};

export function FeedbackModal(props: Props): ReactElement {
  const [messageValue, setMessageValue] = useState('');
  const [contactValue, setContactValue] = useState('');
  const [sending, setSending] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const [showError, setShowError] = useState(false);

  // when form is toggled, error message should not be shown.
  useEffect(() => {
    setShowError(false);
  }, [props.feedbackModalOpen]);

  const onSubmit = async () => {
    setSending(true);

    // does the message not contain any alphanumeric characters (A-Z,0-9,_)
    if (!/\w/.test(messageValue)) {
      setSending(false);
      setShowError(true);
      return;
    }

    // Send an event to amplitude too, just for redundancy.
    macros.logAmplitudeEvent('Feedback', {
      text: messageValue,
      contact: contactValue,
    });

    await axios
      .post(`${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/feedback`, {
        contact: contactValue,
        message: messageValue,
      })
      .catch((error) => {
        macros.error('Unable to submit feedback', error);
        alert(
          `Unable to submit feedback - please submit an issue at https://github.com/sandboxnu/searchneu, and include the following error:\n\n${error}`
        );
      });

    setSending(false);
    setMessageVisible(true);
    setMessageValue('');
    setContactValue('');
    setShowError(false);

    // Hide the message after 2 seconds
    setTimeout(() => {
      setMessageVisible(false);
    }, 2000);

    props.toggleForm();
  };

  const onTextAreaChange = (event) => {
    setMessageValue(event.target.value);
  };

  const onContactChange = (event) => {
    setContactValue(event.target.value);
  };

  const hideMessage = () => {
    setMessageVisible(false);
  };

  const transitionStyles = {
    entering: { opacity: 1 },
    entered: { opacity: 1 },
    exited: { display: 'none', opacity: 0 },
  };

  const firstText =
    "Find a bug in Search NEU? Find a query that doesn't come up with the results you were looking for? Have an idea for an improvement or just want to say hi? Drop a line below! Feel free to write whatever you want to and someone on the team will read it.";

  const secondBody = [
    <p key="0">
      By default this form is anonymous. Leave your name and/or email if you
      want us to be able to contact you.
    </p>,
    <Input
      name="contact"
      form="feedbackForm"
      className="formModalInput"
      onChange={onContactChange}
      key="1"
    />,
  ];

  const header = 'Search NEU Contact Form';

  return (
    <div className="feedback-container">
      <Transition in={messageVisible} timeout={500}>
        {(state) => {
          return (
            <Message
              success
              className="alertMessage"
              header="Your submission was successful."
              style={{ ...transitionStyles[state] }}
              onDismiss={hideMessage}
            />
          );
        }}
      </Transition>
      <Modal
        open={props.feedbackModalOpen}
        onClose={props.toggleForm}
        size="small"
        className="feedback-modal-container"
      >
        <Header icon="mail" content={header} />
        {showError ? (
          <Message color="red" content="Can't submit an empty message!" />
        ) : (
          <></>
        )}
        <Modal.Content className="formModalContent">
          <Form>
            <div className="feedbackParagraph">{firstText}</div>
            <TextArea
              name="response"
              form="feedbackForm"
              className="feedbackTextbox"
              onChange={onTextAreaChange}
            />
            {secondBody}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button basic color="red" onClick={props.toggleForm}>
            <Icon name="remove" />
            Cancel
          </Button>
          <Button
            type="submit"
            color="green"
            form="feedbackForm"
            onClick={onSubmit}
            disabled={sending}
          >
            <Icon name="checkmark" />
            {sending ? 'Sending...' : 'Submit'}
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
}

export default FeedbackModal;
