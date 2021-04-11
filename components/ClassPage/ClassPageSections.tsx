import React, { ReactElement, useEffect, useState } from 'react';
import { isCompositeReq } from '../ResultsPage/Results/useResultDetail';
import { CompositeReq, CourseReq, Requisite } from '../types';
import { HeaderBody } from './HeaderBody';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import { getSeason, getYear } from '../global';
import { LeftNavArrow, RightNavArrow } from '../icons/NavArrow';
import { sortBy, uniq } from 'lodash';
import { Dropdown } from 'semantic-ui-react';

type ClassPageSectionsProps = {
  classPageInfo: GetClassPageInfoQuery;
};

export default function ClassPageSections({
  classPageInfo,
}: ClassPageSectionsProps): ReactElement {
  const allOccurrences = classPageInfo.class.allOccurrences;
  const [currTermIndex, setCurrTermIndex] = useState(0);
  const [sectionCampuses, setSectionCampuses] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState('');

  useEffect(() => {
    setSectionCampuses(getCampusOptions(currTermIndex, classPageInfo));
  }, [currTermIndex]);

  useEffect(() => {
    setSelectedCampus(sectionCampuses[0]);
  }, [sectionCampuses]);

  return (
    <div className="classPageSections">
      <div className="sectionsNav flex justify-space-between">
        <div className="campusNav">
          SECTIONS FOR{' '}
          <Dropdown
            compact
            text={(selectedCampus || '').toUpperCase() + ' CAMPUS'}
            className="sectionsCampusDropdown"
          >
            <Dropdown.Menu className="sectionsCampusDropdownMenu">
              {sectionCampuses.map((campus) => (
                <Dropdown.Item
                  className={'sectionsCampusOption'}
                  value={campus}
                  text={campus.toUpperCase() + ' CAMPUS'}
                  selected={campus === selectedCampus}
                  onClick={() => setSelectedCampus(campus)}
                ></Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <TermNav
          currTermIndex={currTermIndex}
          setCurrTermIndex={setCurrTermIndex}
          classPageInfo={classPageInfo}
        />
      </div>
    </div>
  );
}

function getCampusOptions(
  currTermIndex: number,
  classPageInfo: GetClassPageInfoQuery
): string[] {
  return sortBy(
    uniq(
      classPageInfo.class.allOccurrences[currTermIndex].sections.map(
        (section) => section.campus
      )
    )
  );
}

type termNavProps = {
  currTermIndex: number;
  setCurrTermIndex: (number) => void;
  classPageInfo: GetClassPageInfoQuery;
};

function TermNav({
  currTermIndex,
  setCurrTermIndex,
  classPageInfo,
}: termNavProps): ReactElement {
  const allOccurrences = classPageInfo.class.allOccurrences;
  const currTermId = allOccurrences[currTermIndex].termId;
  const leftNavDisabled = (termIndex) =>
    termIndex === allOccurrences.length - 1;
  const rightNavDisabled = (termIndex) => termIndex === 0;
  return (
    <div className="termNav">
      <span
        onClick={() =>
          setCurrTermIndex(
            Math.min(currTermIndex + 1, allOccurrences.length - 1)
          )
        }
        className={`navArrow ${
          leftNavDisabled(currTermIndex) ? 'disabled' : ''
        }`}
      >
        <LeftNavArrow
          fill={leftNavDisabled(currTermIndex) ? '#969696' : '#000000'}
        />
      </span>
      {`${getSeason(`${currTermId}`)} ${getYear(
        `${currTermId}`
      )}`.toUpperCase()}
      <span
        onClick={() => setCurrTermIndex(Math.max(currTermIndex - 1, 0))}
        className={`navArrow ${
          rightNavDisabled(currTermIndex) ? 'disabled' : ''
        }`}
      >
        <RightNavArrow
          fill={rightNavDisabled(currTermIndex) ? '#969696' : '#000000'}
        />
      </span>
    </div>
  );
}
