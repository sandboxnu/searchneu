# searchneu

The Nextjs framework for the main SearchNEU site

## structure

```txt
searchneu/
├─ app/             Nextjs routes
├─ public/          Nextjs public resources
├─ componenets/     React components
├─ lib/             General / backend logic
├─ scripts/         Misc scripts (TEMP - deprecated moving forward)
│
├─ vercel.json
├─ package.json
├─ tsconfig.json
├─ eslint.config.mjs
├─ instrumentation.ts
├─ next-env.d.ts
├─ next.config.ts
├─ postcss.config.mjs
└─ README.md
```

## quickstart

The easiest way to run the documentation site is through `turbo`:

```bash
turbo run dev --filter=searchneu
```

The runs application for dev and also any dependent packages, rebuilding them
on any changes.

The `dev` script can be invoked directly as well (not preferred):

```bash
pnpm dev
```

The application will then be accessible on http://localhost:3000

## resources

- [Documentation Site]() - COMING SOON
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [ReactJS](https://react.dev/) - learn about React
