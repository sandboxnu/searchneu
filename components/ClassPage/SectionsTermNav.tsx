import React, { ReactElement } from 'react';
import { GetClassPageInfoQuery } from '../../generated/graphql';
import { getSeason, getYear } from '../global';
import { LeftNavArrow, RightNavArrow } from '../icons/NavArrow';

type sectionsTermNavProps = {
  currTermIndex: number;
  setCurrTermIndex: (number) => void;
  classPageInfo: GetClassPageInfoQuery;
};

export default function SectionsTermNav({
  currTermIndex,
  setCurrTermIndex,
  classPageInfo,
}: sectionsTermNavProps): ReactElement {
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
