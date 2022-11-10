import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import { campusToColor } from '../../utils/campusToColor';
import { getRoundedTerm } from '../terms';
import IconGradcap from '../icons/IconGradcap';
import IconScale from '../icons/IconScale';
import IconTie from '../icons/IconTie';
import SearchBar from '../ResultsPage/SearchBar';
import SearchDropdown from '../ResultsPage/SearchDropdown';
import { Campus } from '../types';
import getTermInfos from '../../utils/TermInfoProvider';

interface HomeSearchProps {
  termId: string;
  campus: Campus;
}

const HomeSearch = ({ termId, campus }: HomeSearchProps): ReactElement => {
  const termInfos = getTermInfos();

  const campusLink = (c: Campus): string =>
    `/${c}/${getRoundedTerm(termInfos, c, termId)}`;

  const router = useRouter();
  return (
    <div className="HomeSearch">
      <div className="HomeSearch__campusSelector">
        <Link href={campusLink(Campus.NEU)}>
          <label
            className={
              'HomeSearch__campusSelector--item --neu' +
              (campus === Campus.NEU ? ' --checked' : '')
            }
            htmlFor="campusSelectorNeu"
          >
            <IconGradcap />
            <span>NEU</span>
          </label>
        </Link>
        <Link href={campusLink(Campus.CPS)}>
          <label
            className={
              'HomeSearch__campusSelector--item --cps' +
              (campus === Campus.CPS ? ' --checked' : '')
            }
            htmlFor="campusSelectorCps"
          >
            <IconTie />
            <span>CPS</span>
          </label>
        </Link>
        <Link href={campusLink(Campus.LAW)}>
          <label
            className={
              'HomeSearch__campusSelector--item --law' +
              (campus === Campus.LAW ? ' --checked' : '')
            }
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
            options={termInfos[campus].map((terminfo) => ({
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
