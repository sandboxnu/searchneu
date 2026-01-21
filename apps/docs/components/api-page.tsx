import { bannerOpenapi, searchneuOpenapi } from "@/lib/openapi";
import { createAPIPage } from "fumadocs-openapi/ui";
import client from "./api-page.client";

export const BannerAPIPage = createAPIPage(bannerOpenapi, {
  client,
});

export const SearchNeuAPIPage = createAPIPage(searchneuOpenapi, {
  client,
});
