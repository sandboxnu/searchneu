import * as z from "zod";
import { type ScraperEventEmitter } from "../../events";
import {
  BannerCampusesResponse,
  BannerCampuses,
} from "../../schemas/banner/campuses";
import { baseUrl } from "../endpoints";
import { $fetch } from "../fetch";

/**
 */
export async function scrapeCampuses(
  term: string,
  emitter?: ScraperEventEmitter,
): Promise<z.infer<typeof BannerCampuses>[] | undefined> {
  const endpoint = `${baseUrl}/StudentRegistrationSsb/ssb/classSearch/get_campus?searchTerm=&term=${term}&offset=1&max=100`;
  const resp = await $fetch(endpoint).then((resp) => resp.json());

  const campusResults = BannerCampusesResponse.safeParse(resp);
  if (!campusResults.success) {
    emitter?.emit("error", {
      message: "error parsing banner campus info",
    });
    return;
  }

  return campusResults.data;
}
