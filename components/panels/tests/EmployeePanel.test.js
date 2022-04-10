/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';

import Enzyme, { shallow } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import macros from '../../macros';

import mockData from './mockData';
import EmployeeResult from '../../ResultsPage/Results/EmployeeResult';

Enzyme.configure({ adapter: new Adapter() });

it('should render a desktop employee panel', () => {
  const orig = macros.isMobile;
  macros.isMobile = false;

  const result = shallow(<EmployeeResult employee={mockData.razzaq} />);
  expect(result.debug()).toMatchSnapshot();

  macros.isMobile = orig;
});

it('should render a mobile employee panel', () => {
  const orig = macros.isMobile;
  macros.isMobile = true;

  const result = shallow(<EmployeeResult employee={mockData.razzaq} />);
  expect(result.debug()).toMatchSnapshot();

  macros.isMobile = orig;
});
