import { BannerTermsResponse } from "../../schemas/banner/terms";
import { $fetch } from "../fetch";
import type { ScraperEventEmitter } from "../../events";

/**
 * scrapeTermDefinition
 *
 * @param
 *
 */
export async function scrapeTermDefinition(
  term: string,
  emitter?: ScraperEventEmitter,
) {
  const resp = await $fetch(
    `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/getTerms?offset=1&max=10&searchTerm=${term}`,
  ).then((resp) => resp.json());

  const termsResults = BannerTermsResponse.safeParse(resp);
  if (!termsResults.success) {
    emitter?.emit("error", {
      message: "error parsing banner term info",
    });
    return;
  }

  const matchingTerm = termsResults.data.filter((t) => t.code === term);
  if (matchingTerm.length === 0) {
    emitter?.emit("error", { message: "cannot find term in Banner" });
    return;
  } else if (matchingTerm.length > 1) {
    emitter?.emit("error", { message: "multiple matching terms found" });
    return;
  }

  return matchingTerm[0];
}
