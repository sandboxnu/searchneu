/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { ReactElement, useEffect } from 'react';
import { useQueryParams } from 'use-query-params';
import Footer from '../../../../components/Footer';
import Header from '../../../../components/Header';
import macros from '../../../../components/macros';
import EmptyResultsContainer from '../../../../components/ResultsPage/EmptyResultsContainer';

// import FeedbackModal from '../../../../components/ResultsPage/FeedbackModal/FeedbackModal';
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

import LoadingContainer from '../../../../components/ResultsPage/LoadingContainer';
import useUserInfo from '../../../../utils/useUserInfo';
import TestimonialToast from '../../../../components/Testimonial/TestimonialToast';

export default function Results(): ReactElement | null {
  const router = useRouter();
  const query = (router.query.query as string) || '';
  const campus = router.query.campus as string;
  const termId = router.query.termId as string;

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

  const { error, searchData, loadMore } = useSearch(searchParams);

  const { userInfo, fetchUserInfo, onSignIn, onSignOut } = useUserInfo();

  useEffect(() => {
    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <>
      <div>
        <Header
          title={`Search NEU - ${query}`}
          campus={campus}
          termId={termId}
          searchData={searchData}
          userInfo={userInfo}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
        />

        {!macros.isMobile && <TestimonialToast />}
        {/* {!macros.isMobile && <FeedbackModal />} */}
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
                  fetchUserInfo={fetchUserInfo}
                  onSignIn={onSignIn}
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
