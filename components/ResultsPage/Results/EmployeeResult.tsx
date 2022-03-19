/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React, { ReactElement } from 'react';

import macros from '../../macros';

import Globe from '../../panels/globe.svg';
import { Employee } from '../../../generated/graphql';
import { MobileSearchResult, SearchResult } from './SearchResult';

function prepareEmployeeAttributes(
  employee: Employee
): (string | ReactElement)[] {
  const attributes: (string | ReactElement)[] = [
    `Primary Department: ${
      employee.primaryDepartment ? employee.primaryDepartment : 'Unknown '
    }`,
    employee.primaryRole,
    employee.officeRoom,
  ];

  for (const email of employee.emails) {
    attributes.push(
      <a
        key={email}
        className="employeeEmail"
        role="button"
        tabIndex={0}
        href={`mailto:${email}`}
      >
        {email}
      </a>
    );
  }

  if (employee.phone) {
    // Parse the number to make it look nice
    const match = employee.phone.match(/^(\d{3})(\d{3})(\d{4})$/);
    const parsedPhone = match ? `(${match[1]}) ${match[2]}-${match[3]}` : match;

    attributes.push(
      <a
        key={employee.phone}
        className="employeePhone"
        role="button"
        tabIndex={0}
        href={`tel:${employee.phone}`}
      >
        {parsedPhone}
      </a>
    );
  }

  if (employee.url) {
    attributes.push(
      <a
        key="link"
        target="_blank"
        rel="noopener noreferrer"
        href={employee.url}
      >
        NEU Profile
      </a>
    );
  }

  if (employee.personalSite) {
    attributes.push(
      <a
        key="personalSite"
        target="_blank"
        rel="noopener noreferrer"
        href={employee.personalSite}
      >
        Personal Website
      </a>
    );
  }

  return attributes.filter((x) => x !== null);
}

function injectBRs(arr: (string | ReactElement)[]): (string | ReactElement)[] {
  const retVal = [];

  // Add <br/>s between the elements
  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];
    retVal.push(element);
    if (arr.length - 1 !== i) {
      retVal.push(<br key={i} />);
    }
  }

  return retVal;
}
// On Mobile, display everything in two sections, one below the other, eg:
// Assistant Teaching Professor
// CCIS
// 310B West Village H
// l.razzaq@northeastern.edu
// lrazzaq@ccs.neu.edu
// 617-373-5797
//
// Personal Website

// And on desktop, display two equally sized sections right next to each other, eg:

// Assistant Teaching Professor
// CCIS
// NEU Profile
// Personal Website
//
// 310B West Village H
// l.razzaq@northeastern.edu
// lrazzaq@ccs.neu.edu
// 617-373-5797

// name, id, phone, emails, primaryRole, primaryDepartment, url, officeRoom, officeStreetAddress are all standardized across different data sources.
// The other fields may be present for one (eg, COE), but are not common enough to be used.

// not standardized yet: personalSite, bigPictureLink

interface EmployeeResultProps {
  employee: Employee;
}

export default function EmployeeResult({
  employee,
}: EmployeeResultProps): ReactElement {
  const attributes = prepareEmployeeAttributes(employee);
  let firstColumn = attributes;
  let secondColumn = [];

  if (attributes.length > 2) {
    const half = Math.round(attributes.length / 2);
    console.log(employee.name, half, attributes.length, attributes);

    firstColumn = attributes.slice(0, half);
    secondColumn = attributes.slice(half, attributes.length);
  }

  return (
    <SearchResult
      headerLeft={
        <div className="SearchResult__header--employeeName">
          {employee.name}
        </div>
      }
      body={
        <>
          <div className="SearchResult__panel--column">
            {injectBRs(firstColumn)}
          </div>
          <div className="SearchResult__panel--column">
            {injectBRs(secondColumn)}
          </div>
        </>
      }
    />
  );
}

export function MobileEmployeeResult({
  employee,
}: EmployeeResultProps): ReactElement {
  const attributes = prepareEmployeeAttributes(employee);

  return (
    <MobileSearchResult
      headerLeft={
        <div className="MobileSearchResult__header--employeeName">
          {employee.name}
        </div>
      }
      body={
        <div className="MobileSearchResult__employeeBody">
          {injectBRs(attributes)}
        </div>
      }
    />
  );
}
