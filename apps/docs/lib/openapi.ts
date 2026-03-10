import { createOpenAPI } from "fumadocs-openapi/server";

export const bannerOpenapi = createOpenAPI({
  // the OpenAPI schema, you can also give it an external URL.
  input: ["./content/banner/banner-openapi.yaml"],
  proxyUrl: "/api/proxy",
});

export const searchneuOpenapi = createOpenAPI({
  input: ["./content/searchneu/searchneu-openapi.yaml"],
});

export const authOpenapi = createOpenAPI({
  input: ["http://localhost:3000/api/auth/open-api/generate-schema"],
});
