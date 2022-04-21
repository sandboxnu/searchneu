import React from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { useQueryParams } from 'use-query-params';
import { waitForComponentToPaint } from '../util';
import Results from '../../../pages/[campus]/[termId]/search/[query].tsx';
import { gqlClient } from '../../../utils/courseAPIClient';
import searchResultsGQL from './testData/SearchResultsGQL.json';

Enzyme.configure({ adapter: new Adapter() });

// Because of issues with variable hoisting, had to use var here
// For non project modules, mock functions had to be defined outside of mocks, unsure why
var mockRouterPush = jest.fn();
var mockSetQParams = jest.fn();
var CAMPUS = 'NEU';
var TERM_ID = '202230';
var TERM_TEXT = 'Spring 2022';

// Mock next router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { campus: CAMPUS, termId: TERM_ID },
    push: mockRouterPush,
  }),
}));

// Mock service provider
jest.mock('../../../utils/TermInfoProvider', () => () => ({
  NEU: [{ text: TERM_TEXT, value: TERM_ID }],
  CPS: [],
  LAW: [],
}));

// Mock GraphQL Client
jest.mock('../../../utils/courseAPIClient', () => ({
  gqlClient: {
    searchResults: jest.fn(),
  },
}));

jest.mock('use-query-params', () => ({
  useQueryParams: () => [
    {
      nupath: undefined,
      subject: undefined,
      campus: undefined,
      classType: undefined,
      classIdRange: undefined,
    },
    mockSetQParams,
  ],
  useQueryParam: () => [undefined, undefined],
}));

// create a router instance for testing mock calls
const [_, setQParams] = useQueryParams();
gqlClient.searchResults.mockImplementation(() => searchResultsGQL);

describe.only('Results page integration tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call a search results query wtih the right arguments on mount', () => {
    const resultsPage = mount(<Results />);
    waitForComponentToPaint(resultsPage);
    expect(gqlClient.searchResults).toBeCalledWith({
      offset: 0,
      query: '',
      termId: TERM_ID,
    });
  });

  it('should set query params with subject filter when selected', async () => {
    const resultsPage = mount(<Results />);
    waitForComponentToPaint(resultsPage);
    let subjectFilter = resultsPage.find('.DropdownFilter').at(0);
    // click the dropdown
    subjectFilter.find('input').simulate('click');
    // update the root wrapper component
    resultsPage.update();
    // find the subject filter again in the updated wrapper
    subjectFilter = resultsPage.find('.DropdownFilter').at(0);
    // find the dropdown option in the subject filter and click it
    subjectFilter.find('.DropdownFilter__element').simulate('click');
    expect(setQParams).toBeCalledWith({ subject: ['CS'] });
  });

  it('should set query params with nupath filter when selected', async () => {
    const resultsPage = mount(<Results />);
    waitForComponentToPaint(resultsPage);
    let nupathFilter = resultsPage.find('.DropdownFilter').at(1);
    // click the dropdown
    nupathFilter.find('input').simulate('click');
    // update the root wrapper component
    resultsPage.update();
    // find the nupath filter again in the updated wrapper
    nupathFilter = resultsPage.find('.DropdownFilter').at(1);
    // find the dropdown option in the nupath filter and click it
    nupathFilter.find('.DropdownFilter__element').simulate('click');
    expect(setQParams).toBeCalledWith({ nupath: ['Writing Intensive'] });
  });

  it('should set query params with campus filter when selected', async () => {
    const resultsPage = mount(<Results />);
    waitForComponentToPaint(resultsPage);
    let campusFilter = resultsPage.find('.DropdownFilter').at(2);
    // click the dropdown
    campusFilter.find('input').simulate('click');
    // update the root wrapper component
    resultsPage.update();
    // find the campus filter again in the updated wrapper
    campusFilter = resultsPage.find('.DropdownFilter').at(2);
    // find the dropdown option in the campus filter and click it
    campusFilter.find('.DropdownFilter__element').simulate('click');
    expect(setQParams).toBeCalledWith({ campus: ['Boston'] });
  });

  it('should set query params with class type filter when selected', async () => {
    const resultsPage = mount(<Results />);
    waitForComponentToPaint(resultsPage);
    const classTypeFilterCheckbox = resultsPage
      .find('.CheckboxFilter__element')
      .find('input');
    // click the checkbox
    classTypeFilterCheckbox.simulate('change', { target: { checked: true } });
    expect(setQParams.mock.calls[0][0]).toEqual({ classType: ['Lecture'] });
    // click the checkbox (to uncheck)
    classTypeFilterCheckbox.simulate('change', { target: { checked: false } });
    expect(setQParams.mock.calls[1][0]).toEqual({ classType: [] });
  });

  it('should set query params with class id range filter when selected', async () => {
    const resultsPage = mount(<Results />);
    waitForComponentToPaint(resultsPage);
    const classIdRangeFilter = resultsPage.find('.RangeFilter');
    // find both min/max text input
    const minInput = classIdRangeFilter.find('input').at(0);
    const maxInput = classIdRangeFilter.find('input').at(1);
    // simulate typing some values in
    minInput.simulate('change', { target: { value: '0' } });
    maxInput.simulate('change', { target: { value: '1000' } });
    // click the apply button
    classIdRangeFilter.find('.RangeFilter__apply-input').simulate('click');
    expect(setQParams).toBeCalledWith({ classIdRange: { max: 1000, min: 0 } });
  });
});
