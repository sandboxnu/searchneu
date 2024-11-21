import React, { ReactElement, useCallback } from 'react';

import { useRouter } from 'next/router';
import { termAndCampusToURL } from '../Header';
import { TermInfo, getRoundedTerm } from '../terms';
import { Campus } from '../types';

interface CampusSelectionProps {
  query: string;
  termId: string;
  termInfos: Record<Campus, TermInfo[]>;
  campus: string;
}
function CampusSelection({
  query,
  termId,
  termInfos,
  campus,
}: CampusSelectionProps): ReactElement {
  const router = useRouter();

  const termAndCampusToURLCallback = useCallback(
    (t: string, newCampus: string) => {
      return termAndCampusToURL(t, newCampus, query);
    },
    [query]
  );

  return (
    <div className="Campus_Selection">
      <button
        onClick={() =>
          router.push(
            termAndCampusToURLCallback(
              getRoundedTerm(termInfos, Campus.NEU, termId),
              Campus.NEU
            )
          )
        }
        className={`Campus_Button ${campus === Campus.NEU && 'Campus_NEU'}`}
      >
        NEU
      </button>
      <button
        onClick={() =>
          router.push(
            termAndCampusToURLCallback(
              getRoundedTerm(termInfos, Campus.CPS, termId),
              Campus.CPS
            )
          )
        }
        className={`Campus_Button ${campus === Campus.CPS && 'Campus_CPS'}`}
      >
        CPS
      </button>
      <button
        onClick={() =>
          router.push(
            termAndCampusToURLCallback(
              getRoundedTerm(termInfos, Campus.LAW, termId),
              Campus.LAW
            )
          )
        }
        className={`Campus_Button ${campus === Campus.LAW && 'Campus_LAW'}`}
      >
        LAW
      </button>
    </div>
  );
}

export default React.memo(CampusSelection);
