import { getTerms } from "@/lib/dal/terms";
import { Suspense } from "react";
import { HomeSearchInterface } from "./HomeSearchInterface";

export async function Search() {
  const terms = getTerms();

  return (
    <Suspense>
      <HomeSearchInterface terms={terms} />
    </Suspense>
  );
}
