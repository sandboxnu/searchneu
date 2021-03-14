import React from 'react';

type PageContentProps = {
  termId: string;
  campus: string;
  subject: string;
  classId: string;
};

export default function PageContent({
  termId,
  campus,
  subject,
  classId,
}: PageContentProps) {
  return (
    <div className="pageContent">
      {/* TODO: make this link take the user back to the search results page */}
      <a className="backToResults" href="">
        Back to Search Results
      </a>

      <div className="title">
        <div className="titleItems">
          <h1 className="classCode">{`${subject.toUpperCase()}${classId}`}</h1>
          {/* TODO: get the actual class name */}
          <h2 className="className">{`Class Name`}</h2>
        </div>
      </div>
    </div>
  );
}
