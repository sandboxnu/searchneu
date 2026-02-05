import consola from "consola";
import { BannerTermsResponse } from "../../schemas/banner/terms";
import { $fetch } from "../fetch";

/**
 * scrapeTermDefinition
 *
 * @param
 *
 */
export async function scrapeTermDefinition(term: string) {
  const resp = await $fetch(
    `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/getTerms?offset=1&max=10&searchTerm=${term}`,
  ).then((resp) => resp.json());

  const termsResults = BannerTermsResponse.safeParse(resp);
  if (!termsResults.success) {
    consola.error("error parsing banner term info");
    return;
  }

  const matchingTerm = termsResults.data.filter((t) => t.code === term);
  if (matchingTerm.length === 0) {
    consola.error("cannot find term in Banner");
    return;
  } else if (matchingTerm.length > 1) {
    consola.error("multiple matching terms found");
    return;
  }

  return matchingTerm[0];
}
