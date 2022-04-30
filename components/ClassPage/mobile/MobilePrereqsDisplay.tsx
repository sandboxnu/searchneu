import Link from 'next/link';
import React, { ReactElement } from 'react';
import {
  isCompositeReq,
  isCourseReq,
} from '../../ResultsPage/Results/useResultDetail';
import { CompositeReq, Requisite } from '../../types';

type MobilePrereqsDisplayProps = {
  termId: string;
  campus: string;
  prereqs: Requisite;
  level: number;
};

export default function MobilePrereqsDisplay({
  termId,
  campus,
  prereqs,
  level,
}: MobilePrereqsDisplayProps): ReactElement {
  if (isCompositeReq(prereqs)) {
    const prereq: CompositeReq = prereqs as CompositeReq;
    if (prereq.values.length === 0) {
      return <span>None</span>;
    } else if (prereq.values.length === 1) {
      return (
        <MobilePrereqsDisplay
          termId={termId}
          campus={campus}
          prereqs={prereq.values[0]}
          level={level}
        ></MobilePrereqsDisplay>
      );
    } else {
      return prereq.type === 'and' ? (
        <EachOf prereq={prereq} termId={termId} campus={campus} level={level} />
      ) : (
        <OneOf prereq={prereq} termId={termId} campus={campus} level={level} />
      );
    }
  } else if (isCourseReq(prereqs)) {
    return (
      <Link
        href={`/${campus}/${termId}/classPage/${prereqs.subject}/${prereqs.classId}`}
      >{`${prereqs.subject} ${prereqs.classId}`}</Link>
    );
  } else {
    return <span>{prereqs}</span>;
  }
}

type EachOfOneOfProps = {
  prereq: CompositeReq;
  termId: string;
  campus: string;
  level: number;
};

const EachOf = ({ prereq, termId, campus, level }: EachOfOneOfProps) => {
  return (
    <>
      <span>Each of the following:</span>
      <ol>
        {prereq.values.map((value, index) => (
          <li key={index}>
            <MobilePrereqsDisplay
              key={index}
              termId={termId}
              campus={campus}
              prereqs={value}
              level={level + 1}
            ></MobilePrereqsDisplay>
          </li>
        ))}
      </ol>
    </>
  );
};

const OneOf = ({ prereq, termId, campus, level }: EachOfOneOfProps) => {
  return (
    <>
      <span>
        Choose <b>one</b> of the following:
      </span>
      <ul>
        {prereq.values.map((value, index) => (
          <li key={index}>
            <MobilePrereqsDisplay
              key={index}
              termId={termId}
              campus={campus}
              prereqs={value}
              level={level + 1}
            ></MobilePrereqsDisplay>
          </li>
        ))}
      </ul>
    </>
  );
};
