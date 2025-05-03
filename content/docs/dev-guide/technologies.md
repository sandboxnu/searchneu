---
title: Technologies
icon: Wrench
description: Overview on the technologies used
---

## Next.js

The heart of the project is the [Nextjs](https://nextjs.org/) metaframework (we
can debate later on the whole metaframework thing, since React is technically
a library...) which provides a bunch of functionality and "batteries" for the
[React](https://react.dev/) library. [Typescript](https://www.typescriptlang.org/)
is used as the language over JS for its ability to increase development speed
and catch bugs earlier.

Next (and React) were chosen because of the familiarity within Sandbox with
them between the different projects. Nextjs was specifically used because of
Server Components, as well as tight integration with the Vercel platform (see
below) for additional features.

This project uses many of the modern Next / React features, leaning heavily on
the [React Server Components](https://react.dev/reference/rsc/server-components)
(RSCs) pattern introduced with the concept of the async component tree in the newer
versions of React. This allows for SEO indexing, smaller client bundles, simplier
data feteching patterns on the server, and platform features like [Incremental
Static Regeneration](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
(see [Nextjs docs](https://nextjs.org/docs/app/building-your-application/rendering/server-components#benefits-of-server-rendering)
for explanations)

## Neon / Postgres

asd

## Drizzle ORM

Continuing off the database, an ORM is used to provide a type-safe and fast
way to write SQL queries to the database. [Drizzle](https://orm.drizzle.team/)
is used here because it is a little lighter weight than [Prisma](https://www.prisma.io/)
(which is still an excelent ORM) and allows for better access to raw SQL. This
latter point is important because there are some custom sql queries, mostly in
the update and search processes which would be too difficult / not possible using
an ORM.

## Vercel

The compute behind Search is [Vercel](...) on their serverless platform. While
not as apparent in the repo, we use many features of the Vercel platform, leveraging
their serverless infra to host the site.

## Tailwind CSS

The styling solution is [Tailwind CSS](https://tailwindcss.com/) which provides
an opinionated class-based styling framework. Everything is provided through utility
classes which then apply specific CSS styles.

The rational behind Tailwind is the dev ex of working with it compared to other styling
solutions. The tradeoff here is the additional complexity of having to precompute
the style sheets, conditional class rendering tools (ie [clsx](...), [tailwind-merge](...),
[class-variance-authority](...)), not strict design compliance (Tailwind is _opinionated_
meaning the defaults have inherent value, and thus the desgins act as a basis for
styling rather than the objective truth), slight CSS hacking for cascading behaviors,
and very long `className` fields. The upside is very quick prototyping and locality
of styles to the markup, rather than having to context switch between multiple
places.

## Radix UI

Writing truely good base components that are accessable, good on desktop and mobile,
and flexible in styling with tailwind is difficult. [Radix](https://www.radix-ui.com/)
provides unstyled components which check all the aforementioned boxes, allowing
for the styles to be provided on top. Everything initially comes from [Shadcn UI](https://ui.shadcn.com/)
(that's what this section _should_ be titled) before the styles are modifyed to
match the Search designs.

## Fumadocs

Those are these docs! [Fumadocs](https://fumadocs.dev/) is a bit of a heavy library, but it comes with
all the batteries to setup this wiki. Based on [Markdown](https://www.markdownguide.org/)
it allows for docs to be written in, well, markdown which then get rendered into
this beautiful documentation wiki.

Fumadocs was chosen because it satisfied a few requirements: a) it was markdown based
which would allow for the "rendering" engine to be switched out relatively easily
should it need to be; b) it could be embedded into another site, allowing for the
docs to be on a seperate route rather than a whole site; c) it was lightweight
enough, at least compared to other tools which offered little additional flexability;
d) it looked nice, which does matter.
