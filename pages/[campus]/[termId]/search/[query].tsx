/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import _ from 'lodash';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
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
import LoadingContainer from '../../../../components/ResultsPage/LoadingContainer';

const isWindow = typeof window !== 'undefined';

export default function Results(): ReactElement | null {
  const router = useRouter();
  const query = (router.query.query as string) || '';
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

  const { searchData, loadMore } = useSearch(searchParams);

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
    <div>
      <Header
        router={router}
        title={`Search NEU - ${query}`}
        searchData={searchData}
        termAndCampusToURL={termAndCampusToURL}
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
        <div className="Results_Main">
          {filtersAreSet && (
            <FilterPills filters={filters} setFilters={setQParams} />
          )}
          {!searchData && <LoadingContainer />}
          {searchData && searchData.results.length === 0 && (
            <EmptyResultsContainer
              query={query}
              filtersAreSet={filtersAreSet}
              setFilters={setQParams}
            />
          )}
          {searchData && searchData.results.length > 0 && (
            <ResultsLoader
              results={searchData.results}
              loadMore={loadMore}
              hasNextPage={searchData.hasNextPage}
            />
          )}
          <Footer />
        </div>
      </div>
      <div className="botttomPadding" />
    </div>
  );
}
