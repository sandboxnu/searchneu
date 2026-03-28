# docs

documentation site for SearchNEU

## structure

the majority of this application is auto-generated and should not require changes
except for on-going maintenance.

```txt
docs/
├─ content/         Content location
├─ app/             Nextjs routes
├─ public/          Nextjs public resources
├─ componenets/     React components
├─ lib/             General / backend logic
├─ scripts/         Misc scripts
├─ package.json
├─ ...
└─ README.md
```

the `content/` directory contains the markdown files which are generated into
the documentation site.

## quickstart

the easiest way to run the documentation site is through `turbo`:

```bash
turbo run dev --filter=docs
```

the `dev` script can be invoked directly as well (not preferred):

```bash
pnpm dev
```

## resources

to learn more about Next.js and Fumadocs, take a look at the following
resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Fumadocs](https://fumadocs.dev) - learn about Fumadocs
