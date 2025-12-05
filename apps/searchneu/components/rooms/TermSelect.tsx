"use client";

import { type GroupedTerms } from "@/lib/types";
import type { ComponentProps } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { use } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export function TermSelect(
  props: { terms: Promise<GroupedTerms> } & ComponentProps<
    typeof SelectTrigger
  >,
) {
  const terms = use(props.terms);

  const { term } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCollege =
    Object.keys(terms).find((k) =>
      terms[k as keyof GroupedTerms].find((t) => t.term === term?.toString()),
    ) ?? "neu";

  return (
    <div className="space-y-2">
      <Select
        onValueChange={(e) =>
          router.push(`/catalog/${e}?${searchParams.toString()}`)
        }
        value={term?.toString()}
      >
        <SelectTrigger className="bg-secondary w-full" {...props}>
          <SelectValue placeholder="Select term" />
        </SelectTrigger>
        <SelectContent className="">
          {terms[activeCollege as keyof GroupedTerms].map((t) => (
            <SelectItem key={t.term} value={t.term}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
