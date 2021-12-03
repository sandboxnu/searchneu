import Link from 'next/link';
import React, { ReactElement } from 'react';
import {
  isCompositeReq,
  isCourseReq,
} from '../ResultsPage/Results/useResultDetail';
import { CompositeReq, Requisite } from '../types';

type PrereqsDisplayProps = {
  termId: string;
  campus: string;
  prereqs: Requisite;
  level: number;
};

export default function PrereqsDisplay({
  termId,
  campus,
  prereqs,
  level,
}: PrereqsDisplayProps): ReactElement {
  if (isCompositeReq(prereqs)) {
    const prereq: CompositeReq = prereqs as CompositeReq;
    if (prereq.values.length === 0) {
      return <span>None</span>;
    } else if (prereq.values.length === 1) {
      return (
        <PrereqsDisplay
          termId={termId}
          campus={campus}
          prereqs={prereq.values[0]}
          level={level}
        ></PrereqsDisplay>
      );
    } else {
      return (
        <>
          {level > 0 ? (
            <li>
              <span>{prereq.type === 'and' ? 'Each of' : 'One of'}</span>
              <ul>
                {prereq.values.map((value, index) => (
                  <li key={index}>
                    <PrereqsDisplay
                      key={index}
                      termId={termId}
                      campus={campus}
                      prereqs={value}
                      level={level + 1}
                    ></PrereqsDisplay>
                  </li>
                ))}
              </ul>
            </li>
          ) : (
            <>
              <span>{prereq.type === 'and' ? 'Each of' : 'One of'}</span>
              <ul>
                {prereq.values.map((value, index) => (
                  <li key={index}>
                    <PrereqsDisplay
                      key={index}
                      termId={termId}
                      campus={campus}
                      prereqs={value}
                      level={level + 1}
                    ></PrereqsDisplay>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      );
    }
  } else if (isCourseReq(prereqs)) {
    return (
      <li key={prereqs.subject + prereqs.classId}>
        <Link
          href={`/${campus}/${termId}/classPage/${prereqs.subject}/${prereqs.classId}`}
        >{`${prereqs.subject} ${prereqs.classId}`}</Link>
      </li>
    );
  } else {
    return (
      <li key={prereqs}>
        <span>{prereqs}</span>
      </li>
    );
  }
}
