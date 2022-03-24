import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Enzyme, { mount } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { QueryParamProvider } from 'use-query-params';
import { waitForComponentToPaint } from '../util';
import Results from '../../../pages/[campus]/[termId]/search/[query].tsx';

Enzyme.configure({ adapter: new Adapter() });

// Because of issues with variable hoisting, had to use var here
var mockRouterPush = jest.fn();
var CAMPUS = 'NEU';
var TERM_ID = '202230';
var TERM_TEXT = 'Spring 2022';
var mockGqlSearchResult = jest.fn(() => {
  console.log('HELLOOO');
  return Promise.resolve();
});

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

jest.mock('../../../utils/courseAPIClient', () => ({
  gqlClient: {
    searchResults: mockGqlSearchResult,
  },
  bogus: 'bogus',
}));

describe.only('Home page integration tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should push a query to the router when executing a searching', async () => {
    const resultsPage = await render(
      <QueryParamProvider>
        <Results />
      </QueryParamProvider>
    );
    expect(mockGqlSearchResult).toBeCalledWith(1);
  });
});
