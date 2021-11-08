import { merge } from 'lodash';
import Head from 'next/head';
import Link from 'next/link';
import { NextRouter } from 'next/router';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { BooleanParam, useQueryParam, useQueryParams } from 'use-query-params';
import { getRoundedTerm, getTermInfoForCampus } from '../components/global';
import FilterButton from '../components/icons/FilterButton.svg';
import Logo from '../components/icons/Logo';
import macros from '../components/macros';
import {
  DEFAULT_FILTER_SELECTION,
  FilterSelection,
  QUERY_PARAM_ENCODERS,
} from '../components/ResultsPage/filters';
import SearchBar from '../components/ResultsPage/SearchBar';
import SearchDropdown from '../components/ResultsPage/SearchDropdown';
import useAtTop from '../components/ResultsPage/useAtTop';
import {
  Campus,
  EMPTY_FILTER_OPTIONS,
  SearchResult,
  UserInfo,
} from '../components/types';
import { campusToColor } from '../utils/campusToColor';
import MobileSearchOverlay from './ResultsPage/MobileSearchOverlay';
import { Button } from 'antd';

type HeaderProps = {
  router: NextRouter;
  title: string;
  searchData: SearchResult;
  termAndCampusToURL: (t: string, newCampus: string, query: string) => string;
  userInfo: UserInfo;
  onSignOut: () => void;
};

export default function Header({
  router,
  title,
  searchData,
  termAndCampusToURL,
  userInfo,
  onSignOut,
}: HeaderProps): ReactElement {
  const atTop = useAtTop();
  const [showOverlay, setShowOverlay] = useQueryParam('overlay', BooleanParam);

  const query = (router.query.query as string) || '';
  const termId = router.query.termId as string;
  const campus = router.query.campus as string;

  const termAndCampusToURLCallback = useCallback(
    (t: string, newCampus: string) => {
      return termAndCampusToURL(t, newCampus, query);
    },
    [query, termAndCampusToURL]
  );

  // Get/set some termID-related variables asyncronously
  const [termInfos, setTermInfos] = useState([]);
  const [roundedTerms, setRoundedTerms] = useState([]);

  // The list of termIDs (for the selected campus) is updated every time the campus var changes
  useEffect(() => {
    // Update the lists of terms
    getTermInfoForCampus(Campus[campus.toUpperCase()])
      .then((data) =>
        data.map((terminfo) => ({
          text: terminfo.text,
          value: terminfo.value,
          link: termAndCampusToURLCallback(terminfo.value, campus),
        }))
      )
      .then((data) => setTermInfos(data));
  }, [campus]);

  // The list of roundedTerms is updated every time the termID changes
  // Given a termID and a campus, the roundedTerm is term closest to the termID, but for the given campus
  useEffect(() => {
    const campusOptions = Object.keys(Campus)
      // For each campus, get the rounded term & convert it to the format we need
      .map((c: Campus) =>
        getRoundedTerm(c, termId).then((term) => ({
          text: c,
          value: c,
          link: termAndCampusToURLCallback(term, c),
        }))
      );

    // Resolve all of the promises & set
    Promise.all(campusOptions).then((data) => setRoundedTerms(data));
  }, [termId]);

  const [qParams, setQParams] = useQueryParams(QUERY_PARAM_ENCODERS);
  const filters: FilterSelection = merge({}, DEFAULT_FILTER_SELECTION, qParams);

  const setSearchQuery = (q: string): void => {
    router.push(
      `/${campus}/${termId}/search/${encodeURIComponent(q)}${
        window.location.search
      }`
    );
  };

  if (!termId || !campus) return null;
  if (showOverlay && macros.isMobile) {
    return (
      <MobileSearchOverlay
        filterSelection={filters}
        filterOptions={searchData?.filterOptions || EMPTY_FILTER_OPTIONS()}
        setFilterPills={setQParams}
        onExecute={() => setShowOverlay(false)}
      />
    );
  }
  return (
    <div>
      <Head>
        <title>{title}</title>
      </Head>
      <div className={`Results_Header ${atTop ? 'Results_Header-top' : ''}`}>
        <Link href={`/${campus}/${termId}`}>
          <a className="Results__Logo--wrapper">
            <Logo
              className="Results__Logo"
              aria-label="logo"
              campus={campus as Campus}
            />
          </a>
        </Link>
        <div className="Results__spacer" />
        {macros.isMobile && (
          <div className="Results__mobileSearchFilterWrapper">
            <div className="Results__searchwrapper">
              <SearchBar
                onSearch={setSearchQuery}
                query={query}
                buttonColor={campusToColor[campus]}
              />
            </div>
            <FilterButton
              className="Results__filterButton"
              aria-label="filter-button"
              onClick={() => {
                if (macros.isMobile) {
                  setShowOverlay(true);
                }
              }}
            />
          </div>
        )}
        {!macros.isMobile && (
          <div className="Results__searchwrapper">
            <SearchBar
              onSearch={setSearchQuery}
              query={query}
              buttonColor={campusToColor[campus]}
            />
          </div>
        )}
        <div className="Breadcrumb_Container">
          <div className="Breadcrumb_Container__dropDownContainer">
            <SearchDropdown
              options={roundedTerms}
              value={campus}
              className="searchDropdown"
              compact={false}
            />
          </div>
          <span className="Breadcrumb_Container__slash">/</span>
          <div className="Breadcrumb_Container__dropDownContainer">
            <SearchDropdown
              options={termInfos}
              value={termId}
              className="searchDropdown"
              compact={false}
              key={campus}
            />
          </div>
        </div>
        {userInfo && (
          <>
            <div className="User_Header">{userInfo.phoneNumber}</div>
            <div className="User_SignOut">
              <Button danger onClick={onSignOut}>
                Sign Out
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
