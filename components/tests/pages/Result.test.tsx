/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme, { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import React from 'react';
import { QueryParamProvider } from 'use-query-params';
import Results from '../../../pages/[campus]/[termId]/search/[query]';

describe('cs test query', () => {
  beforeAll(() => {
    jest.mock('next/router', () => ({
      useRouter: () => ({
        query: { campus: 'NEU', termId: '202160', query: 'cs' },
      }),
      useQueryParam: () => false,
    }));

    Enzyme.configure({ adapter: new Adapter() });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should render a section', () => {
    const result = mount(
      <QueryParamProvider>
        <Results />
      </QueryParamProvider>
    );

    expect(result.debug()).toMatchSnapshot();
  });
});

describe('testing honors query', () => {
  beforeAll(() => {
    jest.mock('next/router', () => ({
      useRouter: () => ({
        query: { campus: 'NEU', termId: '202230', query: 'PHIL 1145' },
      }),
      useQueryParam: () => false,
    }));

    Enzyme.configure({ adapter: new Adapter() });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should render a section with honors', () => {
    const result = mount(
      <QueryParamProvider>
        <Results />
      </QueryParamProvider>
    );

    expect(result.debug()).toMatchSnapshot();
  });
});
