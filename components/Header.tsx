import _ from 'lodash';
import Head from 'next/head';
import Link from 'next/link';
import { NextRouter } from 'next/router';
import React, { ReactElement, useCallback } from 'react';
import { BooleanParam, useQueryParam, useQueryParams } from 'use-query-params';
import {
  getAllCampusDropdownOptions,
  getRoundedTerm,
  getTermDropdownOptionsForCampus,
} from '../components/global';
import {
  DEFAULT_FILTER_SELECTION,
  FilterSelection,
  QUERY_PARAM_ENCODERS,
} from '../components/ResultsPage/filters';
import FilterButton from '../components/icons/FilterButton.svg';
import Logo from '../components/icons/Logo';
import macros from '../components/macros';
import SearchBar from '../components/ResultsPage/SearchBar';
import SearchDropdown from '../components/ResultsPage/SearchDropdown';
import {
  Campus,
  EMPTY_FILTER_OPTIONS,
  SearchResult,
} from '../components/types';
import { campusToColor } from '../utils/campusToColor';
import useAtTop from '../components/ResultsPage/useAtTop';
import MobileSearchOverlay from './ResultsPage/MobileSearchOverlay';

type HeaderProps = {
  router: NextRouter;
  title: string;
  searchData: SearchResult;
};

export default function Header({
  router,
  title,
  searchData,
}: HeaderProps): ReactElement {
  const atTop = useAtTop();
  const [showOverlay, setShowOverlay] = useQueryParam('overlay', BooleanParam);

  const query = (router.query.query as string) || '';
  const termId = router.query.termId as string;
  const campus = router.query.campus as string;

  const [qParams, setQParams] = useQueryParams(QUERY_PARAM_ENCODERS);
  const filters: FilterSelection = _.merge(
    {},
    DEFAULT_FILTER_SELECTION,
    qParams
  );

  const setSearchQuery = (q: string): void => {
    router.push(
      `/${campus}/${termId}/search/${encodeURIComponent(q)}${
        window.location.search
      }`
    );
  };
  const setTermAndCampus = useCallback(
    (t: string, newCampus: string) => {
      router.push(
        `/${newCampus}/${t}/search/${encodeURIComponent(query)} ${
          window.location.search
        }`
      );
    },
    [router, query]
  );

  if (!termId || !campus) return null;
  if (showOverlay && macros.isMobile) {
    return (
      <MobileSearchOverlay
        query={query}
        filterSelection={filters}
        filterOptions={searchData?.filterOptions || EMPTY_FILTER_OPTIONS()}
        setFilterPills={setQParams}
        setQuery={(q: string) => setSearchQuery(q)}
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
              options={getAllCampusDropdownOptions()}
              value={campus}
              placeholder="Select a campus"
              onChange={(nextCampus) => {
                setTermAndCampus(
                  getRoundedTerm(nextCampus as Campus, termId),
                  nextCampus
                );
              }}
              className="searchDropdown"
              compact={false}
            />
          </div>
          <span className="Breadcrumb_Container__slash">/</span>
          <div className="Breadcrumb_Container__dropDownContainer">
            <SearchDropdown
              options={getTermDropdownOptionsForCampus(
                Campus[campus.toUpperCase()]
              )}
              value={termId}
              placeholder="Select a term"
              onChange={(nextTermString) => {
                setTermAndCampus(nextTermString, campus);
              }}
              className="searchDropdown"
              compact={false}
              key={campus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
