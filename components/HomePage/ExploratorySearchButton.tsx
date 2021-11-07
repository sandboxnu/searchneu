import React, { ReactElement, useState, useEffect } from 'react';
import { Campus } from '../types';
import { useRouter } from 'next/router';
import { getTermName } from '../global';
import SectionsTermNav from '../ClassPage/SectionsTermNav';

interface ExploratorySearchButtonProps {
  termId: string;
  campus: Campus;
}

const ExploratorySearchButton = ({
  termId,
  campus,
}: ExploratorySearchButtonProps): ReactElement => {
  const router = useRouter();

  const [termName, setTermName] = useState('');

  // The term name should be updated every time either the campus or the term ID changes
  useEffect(() => {
    getTermName(termId).then((t) => {
      // Check if there's a matching name
      if (typeof t !== 'undefined') {
        setTermName(t);
      }
    });
  }, [campus, termId]);

  return (
    <div
      className="searchByFilters"
      onClick={() => router.push(`/${campus}/${termId}/search`)}
    >
      View all classes for
      <span className="selectedCampusAndTerm">{` ${campus} ${termName}`}</span>
    </div>
  );
};

export default ExploratorySearchButton;
