/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 *
 * Types and constants for filters. One source of truth for frontend filters
 */

import _, { isMatch, mapValues, pickBy } from 'lodash';
import {
  ArrayParam,
  BooleanParam,
  NumericObjectParam,
  QueryParamConfig,
} from 'use-query-params';

// Neat utility to get a union type of the keys of T that extend type U.
type FilteredKeys<T, U> = {
  [P in keyof T]: T[P] extends U ? P : never;
}[keyof T];
// Get union type of the values of type T
type ValueOf<T> = T[keyof T];

// ============== Filter categories ================
// Filter categoriesrepresents the different categories of filters that are possible
export const FilterCategories = {
  Toggle: 'Toggle' as const,
  Dropdown: 'Dropdown' as const,
  Checkboxes: 'Checkboxes' as const,
  Range: 'Range' as const,
};
export type FilterCategory = ValueOf<typeof FilterCategories>;

// What type should the value of each category of filter be?
type TypeForCat = {
  Toggle: boolean;
  Dropdown: string[];
  Checkboxes: string[];
  Range: ClassRange;
};
export type ClassRange = { min: number | ''; max: number | '' };

// Query param encoders for each category of filter
const ENCODERS_FOR_CAT: Record<FilterCategory, QueryParamConfig<any, any>> = {
  Toggle: BooleanParam,
  Dropdown: ArrayParam,
  Checkboxes: ArrayParam,
  Range: NumericObjectParam,
};

// ============== Filter specifications ================
// Specify which filters exist, and which category they are
const NUPATH_SPEC: FilterSpec<'Dropdown'> = {
  category: FilterCategories.Dropdown,
  default: [],
  display: 'NU Path',
  order: 2,
};
const SUBJECT_SPEC: FilterSpec<'Dropdown'> = {
  category: FilterCategories.Dropdown,
  default: [],
  display: 'Subject',
  order: 1,
};
const CAMPUS_SPEC: FilterSpec<'Dropdown'> = {
  category: FilterCategories.Dropdown,
  default: [],
  display: 'Campus',
  order: 3,
};
const CLASSTYPE_SPEC: FilterSpec<'Checkboxes'> = {
  category: FilterCategories.Checkboxes,
  default: [],
  display: 'Class Type',
  order: 4,
};
const CLASSIDRANGE_SPEC: FilterSpec<'Range'> = {
  category: FilterCategories.Range,
  default: { min: '', max: '' },
  display: 'Course Number',
  order: 5,
};
export const FILTER_SPECS = {
  nupath: NUPATH_SPEC,
  subject: SUBJECT_SPEC,
  campus: CAMPUS_SPEC,
  classType: CLASSTYPE_SPEC,
  classIdRange: CLASSIDRANGE_SPEC,
};

// A specification for a filter of category C. Needed for conditional types
type FilterSpec<C extends FilterCategory> = {
  category: C;
  display: string;
  order: number;
  default: TypeForCat[C];
};
type FilterSpecs = typeof FILTER_SPECS;

// ============== Types For Components To Use ================
// Represents which filters were selected by a user.
export type FilterSelection = {
  [K in keyof FilterSpecs]?: FilterSpecs[K] extends FilterSpec<infer C>
    ? TypeForCat[C]
    : never;
};

// Represents the options for all filters
export type FilterOptions = Record<
  FilteredKeys<FilterSpecs, FilterSpec<'Dropdown'> | FilterSpec<'Checkboxes'>>,
  Option[]
>;

// A single option in a multiple choice filter
export type Option = {
  value: string;
  count: number;
  description?: string;
};

// ============== Constants For Components To Use ================
export const QUERY_PARAM_ENCODERS: Record<
  keyof FilterSpecs,
  QueryParamConfig<any, any>
> = mapValues(FILTER_SPECS, (spec) => ENCODERS_FOR_CAT[spec.category]);
export const DEFAULT_FILTER_SELECTION: FilterSelection = mapValues<FilterSelection>(
  FILTER_SPECS,
  (spec) => spec.default
);
export const FILTERS_BY_CATEGORY: Record<
  FilterCategory,
  Partial<FilterSpecs>
> = mapValues(FilterCategories, (cat: FilterCategory) => {
  return pickBy(FILTER_SPECS, (spec) => spec.category === cat);
});
export const FILTERS_IN_ORDER = _(FILTER_SPECS)
  .toPairs()
  .map(([key, spec]) => ({ key, ...spec }))
  .sortBy(['order'])
  .value();
export const areFiltersSet = (f: FilterSelection): boolean =>
  !isMatch(DEFAULT_FILTER_SELECTION, f);
