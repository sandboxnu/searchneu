import Link from 'next/link';
import React, { ReactElement } from 'react';
import { isCompositeReq } from '../ResultsPage/Results/useResultDetail';
import { CompositeReq, CourseReq, Requisite } from '../types';

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
  } else {
    const prereq: CourseReq = prereqs as CourseReq;
    return (
      <li key={prereq.subject + prereq.classId}>
        <Link
          href={`/${campus}/${termId}/classPage/${prereq.subject}/${prereq.classId}`}
        >{`${prereq.subject} ${prereq.classId}`}</Link>
      </li>
    );
  }
}
