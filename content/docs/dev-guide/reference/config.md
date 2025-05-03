---
title: Configuration
description: Top-level configuration reference
---

Search integrates many technologies together, which often have their own configuration.
This document is not going to go into detail for every option and every file, read
the respective documentation for that module. Instead this will provide rationals
and details for anything which was configured beyond its default state.

## Next / React

```ts twoslash title="next-config.ts"
import type { NextConfig } from "next";
import withVercelToolbar from "@vercel/toolbar/plugins/next";
import { createMDX } from "fumadocs-mdx/next";

// ---cut---
const nextConfig: NextConfig = {
  serverExternalPackages: ["typescript", "twoslash"],
};

const vercelToolbar = withVercelToolbar();
const mdx = createMDX();

export default mdx(vercelToolbar(nextConfig));
```

```tsx twoslash title="src/app/mdx-components.tsx"
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Popup, PopupContent, PopupTrigger } from "fumadocs-twoslash/ui";

// ---cut---
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    // APIPage: (props) => <APIPage {...openapi.getAPIPageProps(props)} />,
    Popup,
    PopupContent,
    PopupTrigger,
    ...components,
  };
}
```

## Drizzle

### ORM

```ts twoslash title="src/db/index.ts"
import { drizzle } from "drizzle-orm/neon-http";

export const db = drizzle({
  connection: process.env.DATABASE_URL!,
});
```

### Drizzle Kit

```ts twoslash title="drizzle.config.ts"
import { defineConfig } from "drizzle-kit";
// ---cut---
export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT!,
  },
});
```

## Vercel

```json title="vercel.json"
{
    "cron"
}
```
