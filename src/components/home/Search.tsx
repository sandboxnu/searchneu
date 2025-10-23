import { getTerms } from "@/lib/controllers/getTerms";
import { cacheLife } from "next/cache";
import { Suspense } from "react";
import { HomeSearchInterface } from "./HomeSearchInterface";

export async function Search() {
  "use cache";
  cacheLife("max");

  const terms = getTerms();

  return (
    <Suspense>
      <HomeSearchInterface terms={terms} />
    </Suspense>
  );
}
