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
import FooterFeedbackModal from '../../../../components/FeedbackModal';
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
  const [modalOpen, setModalOpen] = useState(false);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

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

  const TotalResultsDisplay = (): ReactElement => {
    // This has to be a null safe because searchData can be undefined on mount
    const totalResults = searchData?.totalCount;
    if (totalResults === undefined) {
      // if it is undefined, dont render results
      return <></>;
    }
    // our ES index has a cap of 10,000 results for any search regardless of
    // pagination. Therefore, if we get the max, we add a + to indicate possibly more.
    let totalResultsStr = '';
    switch (totalResults) {
      case 1:
        totalResultsStr = ' result';
        break;
      case 10000:
        totalResultsStr = '+ results';
        break;
      default:
        totalResultsStr = ' results';
        break;
    }
    return <p>{totalResults.toLocaleString('en-US') + totalResultsStr}</p>;
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
            {filtersAreSet ? (
              <>
                <FilterPills filters={filters} setFilters={setQParams} />
                <div className="Results_Aggregation__withFilters">
                  <TotalResultsDisplay />
                </div>
              </>
            ) : (
              <div className="Results_Aggregation">
                <TotalResultsDisplay />
              </div>
            )}
            {error ? (
              <div className="Results_EmptyContainer">
                <h3> An Error Occurred : ( </h3>
                <a role="button" onClick={toggleModal}>
                  Report a bug
                </a>
              </div>
            ) : !searchData ? (
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
        <div className="botttomPadding" />
      </div>
      <FooterFeedbackModal
        toggleForm={toggleModal}
        feedbackModalOpen={modalOpen}
      />
    </>
  );
}
