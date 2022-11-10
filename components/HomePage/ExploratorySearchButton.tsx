import React, { ReactElement } from 'react';
import { Campus } from '../types';
import { useRouter } from 'next/router';
import { getTermName } from '../terms';
import getTermInfos from '../../utils/TermInfoProvider';

interface ExploratorySearchButtonProps {
  termId: string;
  campus: Campus;
}

const ExploratorySearchButton = ({
  termId,
  campus,
}: ExploratorySearchButtonProps): ReactElement => {
  const router = useRouter();

  const termInfos = getTermInfos();
  const termName = getTermName(termInfos, termId);

  return (
    <div
      className="searchByFilters"
      onClick={() => router.push(`/${campus}/${termId}/search`)}
    >
      {(!campus || !termName) && 'Loading semester data...'}
      {campus && termName && (
        <span>
          View all classes for
          <span className="selectedCampusAndTerm">{` ${campus} ${termName}`}</span>
        </span>
      )}
    </div>
  );
};

export default ExploratorySearchButton;
