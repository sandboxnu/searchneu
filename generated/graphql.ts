import { GraphQLClient } from 'graphql-request';
import { print } from 'graphql';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: any;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']>;
  class?: Maybe<Class>;
  classByHash?: Maybe<ClassOccurrence>;
  sectionByHash?: Maybe<Section>;
  major?: Maybe<Major>;
  search?: Maybe<SearchResultItemConnection>;
};

export type QueryClassArgs = {
  subject: Scalars['String'];
  classId: Scalars['String'];
};

export type QueryClassByHashArgs = {
  hash: Scalars['String'];
};

export type QuerySectionByHashArgs = {
  hash: Scalars['String'];
};

export type QueryMajorArgs = {
  majorId: Scalars['String'];
};

export type QuerySearchArgs = {
  termId: Scalars['Int'];
  query?: Maybe<Scalars['String']>;
  subject?: Maybe<Array<Scalars['String']>>;
  nupath?: Maybe<Array<Scalars['String']>>;
  campus?: Maybe<Array<Scalars['String']>>;
  classType?: Maybe<Array<Scalars['String']>>;
  classIdRange?: Maybe<IntRange>;
  offset?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
};

export type Class = {
  __typename?: 'Class';
  name: Scalars['String'];
  subject: Scalars['String'];
  classId: Scalars['String'];
  occurrence?: Maybe<ClassOccurrence>;
  latestOccurrence?: Maybe<ClassOccurrence>;
  allOccurrences: Array<Maybe<ClassOccurrence>>;
};

export type ClassOccurrenceArgs = {
  termId: Scalars['String'];
};

export type ClassOccurrence = {
  __typename?: 'ClassOccurrence';
  name: Scalars['String'];
  subject: Scalars['String'];
  classId: Scalars['Int'];
  termId: Scalars['Int'];
  desc: Scalars['String'];
  prereqs?: Maybe<Scalars['JSON']>;
  coreqs?: Maybe<Scalars['JSON']>;
  prereqsFor?: Maybe<Scalars['JSON']>;
  optPrereqsFor?: Maybe<Scalars['JSON']>;
  maxCredits?: Maybe<Scalars['Int']>;
  minCredits?: Maybe<Scalars['Int']>;
  classAttributes: Array<Scalars['String']>;
  url: Scalars['String'];
  prettyUrl?: Maybe<Scalars['String']>;
  lastUpdateTime?: Maybe<Scalars['Float']>;
  nupath: Array<Scalars['String']>;
  sections: Array<Section>;
  host: Scalars['String'];
  feeAmount?: Maybe<Scalars['Int']>;
  feeDescription?: Maybe<Scalars['String']>;
};

export type Section = {
  __typename?: 'Section';
  termId: Scalars['String'];
  subject: Scalars['String'];
  classId: Scalars['String'];
  classType: Scalars['String'];
  crn: Scalars['String'];
  seatsCapacity: Scalars['Int'];
  seatsRemaining: Scalars['Int'];
  waitCapacity: Scalars['Int'];
  waitRemaining: Scalars['Int'];
  campus: Scalars['String'];
  honors: Scalars['Boolean'];
  url: Scalars['String'];
  profs: Array<Scalars['String']>;
  meetings?: Maybe<Scalars['JSON']>;
  host: Scalars['String'];
  lastUpdateTime?: Maybe<Scalars['Float']>;
};

export type Major = {
  __typename?: 'Major';
  majorId: Scalars['String'];
  yearVersion: Scalars['String'];
  occurrence?: Maybe<MajorOccurrence>;
  latestOccurrence?: Maybe<MajorOccurrence>;
};

export type MajorOccurrenceArgs = {
  year: Scalars['Int'];
};

export type MajorOccurrence = {
  __typename?: 'MajorOccurrence';
  majorId: Scalars['String'];
  yearVersion: Scalars['String'];
  spec: Scalars['JSON'];
  plansOfStudy: Scalars['JSON'];
};

export type IntRange = {
  min: Scalars['Int'];
  max: Scalars['Int'];
};

export type SearchResultItemConnection = {
  __typename?: 'SearchResultItemConnection';
  totalCount: Scalars['Int'];
  pageInfo: PageInfo;
  nodes?: Maybe<Array<Maybe<SearchResultItem>>>;
  filterOptions: FilterOptions;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  hasNextPage: Scalars['Boolean'];
};

export type SearchResultItem = ClassOccurrence | Employee;

export type Employee = {
  __typename?: 'Employee';
  name: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  emails: Array<Scalars['String']>;
  primaryDepartment?: Maybe<Scalars['String']>;
  primaryRole?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  streetAddress?: Maybe<Scalars['String']>;
  personalSite?: Maybe<Scalars['String']>;
  googleScholarId?: Maybe<Scalars['String']>;
  bigPictureUrl?: Maybe<Scalars['String']>;
  pic?: Maybe<Scalars['String']>;
  link?: Maybe<Scalars['String']>;
  officeRoom?: Maybe<Scalars['String']>;
};

export type FilterOptions = {
  __typename?: 'FilterOptions';
  nupath?: Maybe<Array<FilterAgg>>;
  subject?: Maybe<Array<FilterAgg>>;
  classType?: Maybe<Array<FilterAgg>>;
  campus?: Maybe<Array<FilterAgg>>;
};

export type FilterAgg = {
  __typename?: 'FilterAgg';
  value: Scalars['String'];
  count: Scalars['Int'];
  description?: Maybe<Scalars['String']>;
};

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE',
}

export type GetCourseInfoByHashQueryVariables = Exact<{
  hash: Scalars['String'];
}>;

export type GetCourseInfoByHashQuery = { __typename?: 'Query' } & {
  classByHash?: Maybe<
    { __typename?: 'ClassOccurrence' } & Pick<
      ClassOccurrence,
      'subject' | 'classId'
    >
  >;
};

export type SearchResultsQueryVariables = Exact<{
  termId: Scalars['Int'];
  query?: Maybe<Scalars['String']>;
  offset?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  subject?: Maybe<Array<Scalars['String']> | Scalars['String']>;
  nupath?: Maybe<Array<Scalars['String']> | Scalars['String']>;
  campus?: Maybe<Array<Scalars['String']> | Scalars['String']>;
  classType?: Maybe<Array<Scalars['String']> | Scalars['String']>;
  classIdRange?: Maybe<IntRange>;
}>;

export type SearchResultsQuery = { __typename?: 'Query' } & {
  search?: Maybe<
    { __typename?: 'SearchResultItemConnection' } & Pick<
      SearchResultItemConnection,
      'totalCount'
    > & {
        pageInfo: { __typename?: 'PageInfo' } & Pick<PageInfo, 'hasNextPage'>;
        filterOptions: { __typename?: 'FilterOptions' } & {
          nupath?: Maybe<
            Array<
              { __typename?: 'FilterAgg' } & Pick<
                FilterAgg,
                'value' | 'count' | 'description'
              >
            >
          >;
          subject?: Maybe<
            Array<
              { __typename?: 'FilterAgg' } & Pick<
                FilterAgg,
                'value' | 'count' | 'description'
              >
            >
          >;
          classType?: Maybe<
            Array<
              { __typename?: 'FilterAgg' } & Pick<
                FilterAgg,
                'value' | 'count' | 'description'
              >
            >
          >;
          campus?: Maybe<
            Array<
              { __typename?: 'FilterAgg' } & Pick<
                FilterAgg,
                'value' | 'count' | 'description'
              >
            >
          >;
        };
        nodes?: Maybe<
          Array<
            Maybe<
              | ({ __typename?: 'ClassOccurrence' } & Pick<
                  ClassOccurrence,
                  | 'name'
                  | 'subject'
                  | 'classId'
                  | 'termId'
                  | 'host'
                  | 'desc'
                  | 'nupath'
                  | 'prereqs'
                  | 'coreqs'
                  | 'prereqsFor'
                  | 'optPrereqsFor'
                  | 'maxCredits'
                  | 'minCredits'
                  | 'classAttributes'
                  | 'url'
                  | 'lastUpdateTime'
                  | 'feeAmount'
                  | 'feeDescription'
                > & { type: 'ClassOccurrence' } & {
                    sections: Array<
                      { __typename?: 'Section' } & Pick<
                        Section,
                        | 'campus'
                        | 'classId'
                        | 'classType'
                        | 'crn'
                        | 'honors'
                        | 'host'
                        | 'lastUpdateTime'
                        | 'meetings'
                        | 'profs'
                        | 'seatsCapacity'
                        | 'seatsRemaining'
                        | 'subject'
                        | 'termId'
                        | 'url'
                        | 'waitCapacity'
                        | 'waitRemaining'
                      >
                    >;
                  })
              | ({ __typename?: 'Employee' } & Pick<
                  Employee,
                  | 'bigPictureUrl'
                  | 'emails'
                  | 'firstName'
                  | 'googleScholarId'
                  | 'lastName'
                  | 'link'
                  | 'name'
                  | 'officeRoom'
                  | 'personalSite'
                  | 'phone'
                  | 'primaryDepartment'
                  | 'primaryRole'
                  | 'streetAddress'
                > & { type: 'Employee' })
            >
          >
        >;
      }
  >;
};

export type GetSectionInfoByHashQueryVariables = Exact<{
  hash: Scalars['String'];
}>;

export type GetSectionInfoByHashQuery = { __typename?: 'Query' } & {
  sectionByHash?: Maybe<
    { __typename?: 'Section' } & Pick<Section, 'subject' | 'classId' | 'crn'>
  >;
};

export type GetPagesForSitemapQueryVariables = Exact<{
  termId: Scalars['Int'];
  offset: Scalars['Int'];
}>;

export type GetPagesForSitemapQuery = { __typename?: 'Query' } & {
  search?: Maybe<
    { __typename?: 'SearchResultItemConnection' } & {
      pageInfo: { __typename?: 'PageInfo' } & Pick<PageInfo, 'hasNextPage'>;
      nodes?: Maybe<
        Array<
          Maybe<
            | ({ __typename: 'ClassOccurrence' } & Pick<
                ClassOccurrence,
                'subject' | 'classId' | 'name'
              >)
            | ({ __typename: 'Employee' } & Pick<Employee, 'name'>)
          >
        >
      >;
    }
  >;
};

export const GetCourseInfoByHashDocument = gql`
  query getCourseInfoByHash($hash: String!) {
    classByHash(hash: $hash) {
      subject
      classId
    }
  }
`;
export const SearchResultsDocument = gql`
  query searchResults(
    $termId: Int!
    $query: String
    $offset: Int = 0
    $first: Int = 10
    $subject: [String!]
    $nupath: [String!]
    $campus: [String!]
    $classType: [String!]
    $classIdRange: IntRange
  ) {
    search(
      termId: $termId
      query: $query
      offset: $offset
      first: $first
      subject: $subject
      nupath: $nupath
      campus: $campus
      classType: $classType
      classIdRange: $classIdRange
    ) {
      totalCount
      pageInfo {
        hasNextPage
      }
      filterOptions {
        nupath {
          value
          count
          description
        }
        subject {
          value
          count
          description
        }
        classType {
          value
          count
          description
        }
        campus {
          value
          count
          description
        }
      }
      nodes {
        type: __typename
        ... on Employee {
          bigPictureUrl
          emails
          firstName
          googleScholarId
          lastName
          link
          name
          officeRoom
          personalSite
          phone
          primaryDepartment
          primaryRole
          streetAddress
        }
        ... on ClassOccurrence {
          name
          subject
          classId
          termId
          host
          desc
          nupath
          prereqs
          coreqs
          prereqsFor
          optPrereqsFor
          maxCredits
          minCredits
          classAttributes
          url
          lastUpdateTime
          feeAmount
          feeDescription
          sections {
            campus
            classId
            classType
            crn
            honors
            host
            lastUpdateTime
            meetings
            profs
            seatsCapacity
            seatsRemaining
            subject
            termId
            url
            waitCapacity
            waitRemaining
          }
        }
      }
    }
  }
`;
export const GetSectionInfoByHashDocument = gql`
  query getSectionInfoByHash($hash: String!) {
    sectionByHash(hash: $hash) {
      subject
      classId
      crn
    }
  }
`;
export const GetPagesForSitemapDocument = gql`
  query getPagesForSitemap($termId: Int!, $offset: Int!) {
    search(termId: $termId, offset: $offset, first: 1000) {
      pageInfo {
        hasNextPage
      }
      nodes {
        __typename
        ... on ClassOccurrence {
          subject
          classId
          name
        }
        ... on Employee {
          name
        }
      }
    }
  }
`;

export type SdkFunctionWrapper = <T>(action: () => Promise<T>) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (sdkFunction) => sdkFunction();
export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper
) {
  return {
    getCourseInfoByHash(
      variables: GetCourseInfoByHashQueryVariables,
      requestHeaders?: Headers
    ): Promise<GetCourseInfoByHashQuery> {
      return withWrapper(() =>
        client.request<GetCourseInfoByHashQuery>(
          print(GetCourseInfoByHashDocument),
          variables,
          requestHeaders
        )
      );
    },
    searchResults(
      variables: SearchResultsQueryVariables,
      requestHeaders?: Headers
    ): Promise<SearchResultsQuery> {
      return withWrapper(() =>
        client.request<SearchResultsQuery>(
          print(SearchResultsDocument),
          variables,
          requestHeaders
        )
      );
    },
    getSectionInfoByHash(
      variables: GetSectionInfoByHashQueryVariables,
      requestHeaders?: Headers
    ): Promise<GetSectionInfoByHashQuery> {
      return withWrapper(() =>
        client.request<GetSectionInfoByHashQuery>(
          print(GetSectionInfoByHashDocument),
          variables,
          requestHeaders
        )
      );
    },
    getPagesForSitemap(
      variables: GetPagesForSitemapQueryVariables,
      requestHeaders?: Headers
    ): Promise<GetPagesForSitemapQuery> {
      return withWrapper(() =>
        client.request<GetPagesForSitemapQuery>(
          print(GetPagesForSitemapDocument),
          variables,
          requestHeaders
        )
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
