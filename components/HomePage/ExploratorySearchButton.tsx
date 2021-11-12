import React, { ReactElement, useContext } from 'react';
import { Campus } from '../types';
import { useRouter } from 'next/router';
import { getTermName } from '../terms';
import { termsContext } from '../common/TermInfoContext';

interface ExploratorySearchButtonProps {
  termId: string;
  campus: Campus;
}

const ExploratorySearchButton = ({
  termId,
  campus,
}: ExploratorySearchButtonProps): ReactElement => {
  const router = useRouter();

  const termInfos = useContext(termsContext);
  const termName = getTermName(termInfos, termId);

  return (
    <div
      className="searchByFilters"
      onClick={() => router.push(`/${campus}/${termId}/search`)}
    >
      {campus && termName ? (
        <span>
          View all classes for{' '}
          <span className="selectedCampusAndTerm">{` ${campus} ${termName}`}</span>
        </span>
      ) : (
        'Loading...'
      )}
    </div>
  );
};

export default ExploratorySearchButton;
