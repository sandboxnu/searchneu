"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, use } from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { useSearchParamWriter } from "@/lib/catalog/useSearchParamWriter";
import { cn } from "@/lib/cn";
import { FilterSection, FilterSkeleton } from "./FilterSection";

export interface Option {
  label: string;
  value: string;
  // When present, the dropdown is rendered as grouped sections instead of a
  // flat list. Options sharing the same `group` are collected together.
  group?: string;
}

interface MultiselectProps<T> {
  id?: string;
  opts: Promise<T[]>;
  spCode: string;
  transform: (opts: T[]) => Option[];
  placeholder: string;
}

// SPMultiselect is a multiselect whose state lives in the URL search params.
// The label, "Clear all" action, and loading skeleton render synchronously;
// only the combobox control suspends on `opts`, so the label stays visible
// while options load. Provide a `group` on each option (via `transform`) to
// render the dropdown as grouped sections rather than a flat list.
export function SPMultiselect<T>(props: MultiselectProps<T> & { label: string }) {
  return (
    <FilterSection
      label={props.label}
      htmlFor={props.id}
      action={<ClearFilterButton spCode={props.spCode} />}
    >
      <Suspense fallback={<FilterSkeleton />}>
        <MultiselectControl
          id={props.id}
          opts={props.opts}
          spCode={props.spCode}
          transform={props.transform}
          placeholder={props.placeholder}
        />
      </Suspense>
    </FilterSection>
  );
}

// Shows "Clear all" only when this filter has selections. It depends only on
// the URL (not the async options), so it can live outside the Suspense
// boundary alongside the label.
function ClearFilterButton(props: { spCode: string }) {
  const searchParams = useSearchParams();
  const { setValues } = useSearchParamWriter();

  if (searchParams.getAll(props.spCode).length === 0) return null;

  return (
    <button
      type="button"
      className="text-blue hover:text-blue/80 cursor-pointer text-xs"
      onClick={() => setValues(props.spCode, [])}
    >
      Clear all
    </button>
  );
}

function MultiselectControl<T>(props: MultiselectProps<T>) {
  const { setValues } = useSearchParamWriter();
  const searchParams = useSearchParams();

  const options = props.transform(use(props.opts));
  const grouped = options.some((o) => o.group !== undefined);

  // Flat lists are alphabetized; grouped lists keep the order produced by
  // `transform` so the section order stays meaningful.
  if (!grouped) {
    options.sort((a, b) => a.label.localeCompare(b.label));
  }

  const spSelected = searchParams.getAll(props.spCode);
  // `selected` is filtered out of `options` so the objects keep referential
  // equality with the combobox's `items`, letting its default comparison mark
  // selections correctly.
  const selected = options.filter((s) => spSelected.includes(s.value));

  // Combobox consumes grouped items as `{ value, items }[]`. Build the groups
  // from `options` so the leaf items keep the same references as `selected`.
  const groups = grouped
    ? Array.from(new Set(options.map((o) => o.group))).map((group) => ({
        value: group ?? "",
        items: options.filter((o) => o.group === group),
      }))
    : [];

  // Anchor the dropdown to the whole chips container so it appears below the
  // full input rather than only the remaining space beside the chips.
  const anchorRef = useComboboxAnchor();

  const renderItem = (opt: Option) => (
    <ComboboxItem key={opt.value} value={opt}>
      {opt.value !== opt.label && (
        <span className="font-bold">{opt.value}</span>
      )}
      <span>{opt.label}</span>
    </ComboboxItem>
  );

  return (
    <Combobox
      items={grouped ? groups : options}
      multiple
      value={selected}
      onValueChange={(opts: Option[]) =>
        setValues(
          props.spCode,
          opts.map((o) => o.value),
        )
      }
      itemToStringLabel={(opt: Option) => opt.label}
      itemToStringValue={(opt: Option) => opt.value}
      filter={(opt: Option, query: string) => {
        const q = query.toLowerCase();
        return (
          opt.label.toLowerCase().includes(q) ||
          opt.value.toLowerCase().includes(q)
        );
      }}
    >
      <ComboboxChips ref={anchorRef}>
        <ComboboxValue>
          {(values: Option[]) =>
            values.map((opt) => (
              <ComboboxChip key={opt.value} aria-label={opt.label}>
                {opt.value !== opt.label && (
                  <span className="text-neu8 font-bold">{opt.value}</span>
                )}
                <span
                  className={cn(
                    opt.value === opt.label ? "text-neu8" : "text-neu7",
                  )}
                >
                  {opt.label}
                </span>
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput
          id={props.id}
          placeholder={selected.length > 0 ? undefined : props.placeholder}
        />
      </ComboboxChips>

      <ComboboxContent anchor={anchorRef}>
        <ComboboxEmpty>No results found</ComboboxEmpty>
        <ComboboxList>
          {grouped
            ? (group: { value: string; items: Option[] }) => (
                <ComboboxGroup key={group.value} items={group.items}>
                  <ComboboxLabel>{group.value.toUpperCase()}</ComboboxLabel>
                  <ComboboxCollection>{renderItem}</ComboboxCollection>
                </ComboboxGroup>
              )
            : renderItem}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
