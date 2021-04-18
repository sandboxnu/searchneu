/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import { isEqual, pickBy } from 'lodash';
import { useEffect } from 'react';
import { useSWRInfinite } from 'swr';
import macros from '../macros';
import { SearchResult } from '../types';
import {
  DEFAULT_FILTER_SELECTION,
  FilterOptions,
  FilterSelection,
} from './filters';
import { gqlClient } from '../../utils/courseAPIClient';
import { SearchResultsQuery } from '../../generated/graphql';

export interface SearchParams {
  termId: string;
  query: string;
  filters: FilterSelection;
}
interface UseSearchReturn {
  searchData: SearchResult;
  loadMore: () => void;
}

const apiVersion = 2;

let count = 0;
// Log search queries to amplitude on enter.
function logSearch(searchQuery: string): void {
  searchQuery = searchQuery.trim();

  if (searchQuery) {
    count++;
    macros.logAmplitudeEvent('Search', {
      query: searchQuery.toLowerCase(),
      sessionCount: count,
    });
  }
}

/**
 * P is the type of the search params, R is the type of the result item
 *
 * @param initialParams initial params to give fetchresults
 * @param fetchResults function to get the results
 * @returns
 *  results is a list of results
 *  isReady represents whether the results are ready to be displayed
 *  loadMore is a function that triggers loading the next page when invoked
 *  doSearch triggers search execution. Expects a object containing search params
 */
export default function useSearch({
  termId,
  query,
  filters,
}: SearchParams): UseSearchReturn {
  const getKey = (pageIndex: number): string => {
    if (!termId) {
      // don't make the request until data is good
      return null;
    }
    const nonDefaultFilters = pickBy(
      filters,
      (v, k: keyof FilterSelection) => !isEqual(v, DEFAULT_FILTER_SELECTION[k])
    );
    return JSON.stringify({
      query,
      termId,
      minIndex: String(pageIndex * 10),
      maxIndex: String((pageIndex + 1) * 10),
      apiVersion: String(apiVersion),
      filters: nonDefaultFilters,
    });
  };

  const { data, size, setSize } = useSWRInfinite(
    getKey,
    async (params): Promise<SearchResult> => {
      params = JSON.parse(params);
      const searchResults = await gqlClient.searchResults({
        termId: parseInt(termId),
        query: params.query,
        offset: parseInt(params.minIndex),
        ...params.filters,
      });
      return transformGraphQLToSearchResult(searchResults);
    }
  );

  const queryKey = getKey(0);
  useEffect(() => {
    if (size === 1 && queryKey) {
      logSearch(queryKey);
    }
  }, [queryKey, size]);

  const returnedData = data && {
    filterOptions: data[0].filterOptions,
    results: data.map((d) => d.results).flat(),
    hasNextPage: data[0].hasNextPage,
  };

  return {
    searchData: returnedData,
    loadMore: () => setSize((s) => s + 1),
  };
}

function transformGraphQLToSearchResult(
  graphqlResults: SearchResultsQuery
): SearchResult {
  const transformedResults: SearchResult = {
    results: [],
    filterOptions: graphqlResults.search.filterOptions as FilterOptions,
    hasNextPage: graphqlResults.search.pageInfo.hasNextPage,
  };
  transformedResults.results = graphqlResults.search.nodes.map((node) => {
    if (node.type === 'ClassOccurrence') {
      return {
        sections: node.sections,
        class: {
          ...node,
          termId: node.termId.toString(),
        },
        type: 'class',
      };
    } else {
      return {
        employee: node,
        type: 'employee',
      };
    }
  });

  return transformedResults;
}
