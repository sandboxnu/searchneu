import React from 'react';
import Enzyme, { mount } from 'enzyme';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { waitForComponentToPaint } from '../util';
import Home from '../../../pages/[campus]/[termId].tsx';
import { useRouter } from 'next/router';

Enzyme.configure({ adapter: new Adapter() });

// Because of issues with variable hoisting, had to use var here
var mockRouterPush = jest.fn();
var CAMPUS = 'NEU';
var TERM_ID = '202230';
var TERM_TEXT = 'Spring 2022';

// Mock next router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: () => ({ campus: CAMPUS, termId: TERM_ID }),
    push: mockRouterPush,
  }),
}));

// Mock service provider
jest.mock('../../../utils/TermInfoProvider', () => () => ({
  NEU: [{ text: TERM_TEXT, value: TERM_ID }],
  CPS: [],
  LAW: [],
}));
/* 
Mock axios using a mock adapter. For some reason I couldn't mock
with jest while using an outside var (like router push) without issues
*/
let mockAxios;
// Creating a router instance to test mock calls. There were a lot of issues with using
// mock instance instantiated above, it works far more consistently importing the module
// and testing the import. Linting does not like that though
// eslint-disable-next-line
const router = useRouter();

describe.only('Home page integration tests', () => {
  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockAxios.reset();
  });

  it('should push a query to the router when executing a searching', () => {
    const homePage = mount(<Home />);
    const searchBarInput = homePage.find('input');
    const searchButton = homePage.find('.searchbar__button');

    const SEARCH_DATA = 'data structures';

    searchBarInput.simulate('change', { target: { value: SEARCH_DATA } });
    searchButton.simulate('click');

    expect(router.push).toBeCalledWith(
      `/${CAMPUS}/${TERM_ID}/search/${SEARCH_DATA}`
    );
  });

  it('should push a query to the router when clicking the exploratory search', () => {
    const homePage = mount(<Home />);
    const exploratorySearchButton = homePage.find('ExploratorySearchButton');

    exploratorySearchButton.simulate('click');

    expect(router.push).toBeCalledWith(`/${CAMPUS}/${TERM_ID}/search`);
  });

  it('should send a post request with relevant data on feedback submit', async () => {
    // need to reply with 200 so we don't enter catcch
    mockAxios.onPost().reply(200);
    // define our env variables for post request
    process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT = 'localhost:8080';
    // constant for entering and testing data
    const FEEDBACK_DATA = {
      contact: 'annoyed user',
      message: 'Hey where are summer classes',
    };

    const homePage = mount(<Home />);
    // part of an issue described in the util.js file for testing
    waitForComponentToPaint(homePage);
    const feedbackButton = homePage.find('.contact').childAt(0);

    feedbackButton.simulate('click');

    const feedbackModal = homePage.find('FeedbackModal');

    const feedbackMessageText = feedbackModal.find('TextArea');
    const feedbackContactText = feedbackModal.find('Input').find('input');
    const submitButton = feedbackModal.find('Button').at(1);

    feedbackMessageText.simulate('change', {
      target: { value: FEEDBACK_DATA.message },
    });
    feedbackContactText.simulate('change', {
      target: { value: FEEDBACK_DATA.contact },
    });
    // have to await clicking because it makes a post request
    await submitButton.simulate('click');

    expect(mockAxios.history.post.length).toBe(1);
    expect(mockAxios.history.post[0].url).toBe(
      `${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/feedback`
    );
    expect(mockAxios.history.post[0].data).toBe(JSON.stringify(FEEDBACK_DATA));
  });
});
