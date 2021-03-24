import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import { campusToColor } from '../../utils/campusToColor';
import { getRoundedTerm, getTermInfoForCampus } from '../global';
import IconGradcap from '../icons/IconGradcap';
import IconScale from '../icons/IconScale';
import IconTie from '../icons/IconTie';
import SearchBar from '../ResultsPage/SearchBar';
import SearchDropdown from '../ResultsPage/SearchDropdown';
import { Campus } from '../types';

interface HomeSearchProps {
  termId: string;
  campus: Campus;
}

const HomeSearch = ({ termId, campus }: HomeSearchProps): ReactElement => {
  const router = useRouter();
  return (
    <div className="HomeSearch">
      <div className="HomeSearch__campusSelector">
        <input
          type="radio"
          id="campusSelectorNeu"
          name="CampusSelector"
          defaultChecked={campus == Campus.NEU}
        />
        <Link href={`/${Campus.NEU}/${getRoundedTerm(Campus.NEU, termId)}`}>
          <label
            className="HomeSearch__campusSelector--neu"
            htmlFor="campusSelectorNeu"
          >
            <IconGradcap />
            <span>NEU</span>
          </label>
        </Link>
        <input
          type="radio"
          id="campusSelectorCps"
          name="CampusSelector"
          defaultChecked={campus == Campus.CPS}
        />
        <Link href={`/${Campus.CPS}/${getRoundedTerm(Campus.CPS, termId)}`}>
          <label
            className="HomeSearch__campusSelector--cps"
            htmlFor="campusSelectorCps"
          >
            <IconTie />
            <span>CPS</span>
          </label>
        </Link>
        <input
          type="radio"
          id="campusSelectorLaw"
          name="CampusSelector"
          defaultChecked={campus == Campus.LAW}
        />
        <Link href={`/${Campus.LAW}/${getRoundedTerm(Campus.LAW, termId)}`}>
          <label
            className="HomeSearch__campusSelector--law"
            htmlFor="campusSelectorLaw"
          >
            <IconScale />
            <span>Law</span>
          </label>
        </Link>
      </div>
      <div className="HomeSearch__searchBar">
        <div className="HomeSearch__searchBar--input">
          <SearchBar
            onSearch={(q) => {
              router.push(`/${campus}/${termId}/search/${q}`);
            }}
            query=""
            buttonColor={campusToColor[campus]}
          />
        </div>
        <div className="HomeSearch__searchBar--dropdown">
          <SearchDropdown
            options={getTermInfoForCampus(campus).map((terminfo) => ({
              text: terminfo.text,
              value: terminfo.value,
              link: `/${campus}/${terminfo.value}`,
            }))}
            value={termId}
            className="searchDropdown"
            compact={false}
            key={campus}
          />
        </div>
      </div>
    </div>
  );
};

export default HomeSearch;
