import { merge } from 'lodash';
import Head from 'next/head';
import Link from 'next/link';
import { NextRouter } from 'next/router';
import React, { ReactElement, useCallback } from 'react';
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

  const [qParams, setQParams] = useQueryParams(QUERY_PARAM_ENCODERS);
  const filters: FilterSelection = merge({}, DEFAULT_FILTER_SELECTION, qParams);

  const setSearchQuery = (q: string): void => {
    router.push(
      `/${campus}/${termId}/search/${encodeURIComponent(q)}${
        window.location.search
      }`
    );
  };

  const termAndCampusToURLCallback = useCallback(
    (t: string, newCampus: string) => {
      return termAndCampusToURL(t, newCampus, query);
    },
    [query, termAndCampusToURL]
  );

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
              options={Object.keys(Campus).map((c: Campus) => ({
                text: c,
                value: c,
                link: termAndCampusToURLCallback(getRoundedTerm(c, termId), c),
              }))}
              value={campus}
              className="searchDropdown"
              compact={false}
            />
          </div>
          <span className="Breadcrumb_Container__slash">/</span>
          <div className="Breadcrumb_Container__dropDownContainer">
            <SearchDropdown
              options={getTermInfoForCampus(Campus[campus.toUpperCase()]).map(
                (terminfo) => ({
                  text: terminfo.text,
                  value: terminfo.value,
                  link: termAndCampusToURLCallback(terminfo.value, campus),
                })
              )}
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
