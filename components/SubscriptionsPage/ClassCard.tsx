import { ReactElement } from 'react';
import { Section } from '../types';

type ClassCardType = {
  course: { subject: string; classId: string; name: string };
  sections: Section[];
};

export const ClassCard = ({
  course,
  sections,
}: ClassCardType): ReactElement => {
  return (
    <>
      <div>
        <div>{course.subject + ' ' + course.classId + ': ' + course.name}</div>
      </div>

      {sections.map((section) => {
        return (
          <div
            key={section.crn}
            style={{
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <div>CRN: {section.crn}</div>
            <div>Professor: {section.profs}</div>
          </div>
        );
      })}
    </>
  );
};
