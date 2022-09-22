/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme, { mount } from 'enzyme';
import { waitForComponentToPaint } from '../util';
import React from 'react';
import { QueryParamProvider } from 'use-query-params';
import Results from '../../../pages/[campus]/[termId]/search/[query]';

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { campus: 'NEU', termId: '202160', query: 'cs' },
  }),
  useQueryParam: () => false,
}));

Enzyme.configure({ adapter: new Adapter() });

it('should render a section', () => {
  const result = mount(
    <QueryParamProvider>
      <Results />
    </QueryParamProvider>
  );
  waitForComponentToPaint(result);

  expect(result.debug()).toMatchSnapshot();
});
