/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { ReactElement, useEffect, useState } from 'react';
import { useQueryParams } from 'use-query-params';
import Footer from '../../../../components/Footer';
import Header from '../../../../components/Header';
import macros from '../../../../components/macros';
import EmptyResultsContainer from '../../../../components/ResultsPage/EmptyResultsContainer';

import FeedbackModal from '../../../../components/ResultsPage/FeedbackModal/FeedbackModal';
import FilterPanel from '../../../../components/ResultsPage/FilterPanel';
import FilterPills from '../../../../components/ResultsPage/FilterPills';
import {
  areFiltersSet,
  DEFAULT_FILTER_SELECTION,
  FilterSelection,
  QUERY_PARAM_ENCODERS,
} from '../../../../components/ResultsPage/filters';
import ResultsLoader from '../../../../components/ResultsPage/ResultsLoader';
import useSearch, {
  SearchParams,
} from '../../../../components/ResultsPage/useSearch';
import { EMPTY_FILTER_OPTIONS } from '../../../../components/types';

import Cookies from 'universal-cookie';
import axios from 'axios';
import LoadingContainer from '../../../../components/ResultsPage/LoadingContainer';

const cookies = new Cookies();

const isWindow = typeof window !== 'undefined';

export default function Results(): ReactElement | null {
  const router = useRouter();
  const query = (router.query.query as string) || '';
  const termId = router.query.termId as string;
  const [userInfo, setUserInfo] = useState(null);

  const [qParams, setQParams] = useQueryParams(QUERY_PARAM_ENCODERS);

  const filters: FilterSelection = _.merge(
    {},
    DEFAULT_FILTER_SELECTION,
    qParams
  );

  const searchParams: SearchParams = {
    termId,
    query,
    filters,
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const onSignOut = (): void => {
    cookies.remove('SearchNEU JWT', { path: '/' });
    setUserInfo(null);
  };

  const onSignIn = (token: string): void => {
    cookies.set('SearchNEU JWT', token, { path: '/' });
    fetchUserInfo();
  };

  const fetchUserInfo = (): void => {
    const token = cookies.get('SearchNEU JWT');
    if (token) {
      axios
        .get(
          `${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/user/subscriptions/${token}`
        )
        .then(({ data }) => {
          setUserInfo({ token, ...data });
        });
    }
  };

  const { error, searchData, loadMore } = useSearch(searchParams);

  useEffect(() => {
    if (error) {
      console.log('There was an error during your search: ' + error);
      router.push('/error');
    }
  }, [router, error]);

  if (!query && !termId) {
    return null;
  }

  const filtersAreSet: boolean = areFiltersSet(filters);

  const termAndCampusToURL = (
    t: string,
    newCampus: string,
    query: string
  ): string => {
    return `/${newCampus}/${t}/search/${encodeURIComponent(query)}${
      isWindow && window.location.search
    }`;
  };

  return (
    <>
      <div>
        <Header
          router={router}
          title={`Search NEU - ${query}`}
          searchData={searchData}
          termAndCampusToURL={termAndCampusToURL}
          userInfo={userInfo}
          onSignOut={onSignOut}
          onSignIn={onSignIn}
        ></Header>

        {!macros.isMobile && <FeedbackModal />}
        <div className="Results_Container">
          {!macros.isMobile && (
            <>
              <div className="Results_SidebarWrapper">
                <FilterPanel
                  options={searchData?.filterOptions || EMPTY_FILTER_OPTIONS()}
                  selected={filters}
                  setActive={setQParams}
                />
              </div>
              <div className="Results_SidebarSpacer" />
            </>
          )}

          <div className="Results_MainWrapper">
            <div className="Results_Main">
              {filtersAreSet && (
                <>
                  <FilterPills filters={filters} setFilters={setQParams} />
                </>
              )}
              {!searchData ? (
                <LoadingContainer />
              ) : searchData && searchData.results.length === 0 ? (
                <EmptyResultsContainer
                  query={query}
                  filtersAreSet={filtersAreSet}
                  setFilters={setQParams}
                />
              ) : (
                <ResultsLoader
                  results={searchData.results}
                  loadMore={loadMore}
                  hasNextPage={searchData.hasNextPage}
                  userInfo={userInfo}
                  onSignIn={onSignIn}
                  fetchUserInfo={fetchUserInfo}
                />
              )}
              <Footer />
            </div>
          </div>
        </div>
        <div className="botttomPadding" />
      </div>
    </>
  );
}
