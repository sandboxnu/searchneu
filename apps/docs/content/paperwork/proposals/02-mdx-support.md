---
title: 02 - MDX Support
---

Adding dependancy to allow md/mdx files to act as routable pages in next.js

## WHY

Our current terms of service and privacy pages are written in Markdown format 
and in order to serve them as pages within Next.js without duplicating content, 
we need MDX support.

## WHAT

This change adds the @next/mdx dependency and corresponding Next.js configuration 
to enable Markdown files to function as pages.

## IMPLIMENTATION STEPS

1. Deploy to production and verify the build completes successfully
2. Run `pnpm install` to install the `@next/mdx` dependency

## ROLLBACK STEPS

IF the production build fails:
1. Declare a PCP incident for the failed production deployment
3. Revert the MDX dependency and configuration with a new PR

No data or infrastructure rollback is required.
