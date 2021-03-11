import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useCallback } from 'react';
import { BooleanParam, useQueryParam, useQueryParams } from 'use-query-params';
import {
  getAllCampusDropdownOptions,
  getRoundedTerm,
  getTermDropdownOptionsForCampus,
} from '../../../../../components/global';
import FilterButton from '../../../../../components/icons/FilterButton.svg';
import Logo from '../../../../../components/icons/Logo';
import macros from '../../../../../components/macros';
import SearchBar from '../../../../../components/ResultsPage/SearchBar';
import SearchDropdown from '../../../../../components/ResultsPage/SearchDropdown';
import { Campus } from '../../../../../components/types';
import { campusToColor } from '../../../../../utils/campusToColor';
import useAtTop from '../../../../../components/ResultsPage/useAtTop';

export default function Page() {
  const atTop = useAtTop();
  const router = useRouter();
  const [showOverlay, setShowOverlay] = useQueryParam('overlay', BooleanParam);

  const query = (router.query.query as string) || '';
  const termId = router.query.termId as string;
  const campus = router.query.campus as string;
  const subject = router.query.subject as string;
  const classId = router.query.classId as string;

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
  if (!campus) return null;
  return (
    <div>
      <Head>
        <title>Class Page {subject + classId}</title>
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
