import { docs } from "../../.source";
import { loader } from "fumadocs-core/source";
import { icons } from "lucide-react";
import { createElement } from "react";
import { createOpenAPI, openapiPlugin } from "fumadocs-openapi/server";

export const source = loader({
  baseUrl: "/docs",
  plugins: [openapiPlugin()],
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) {
      return;
    }

    if (icon in icons) return createElement(icons[icon as keyof typeof icons]);
  },
});

export const openapi = createOpenAPI({
  proxyUrl: "/api/proxy",
});
