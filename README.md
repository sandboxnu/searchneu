# searchneu

the rewrite

## project structure

```txt
/
├── package.json
├── vercel.json             # vercel deployment config
├── components.json         # shadcn component config
├── tsconfig.json           # typescript config
├── .env.example            # template environment variables
│
├── cache/                  # term caches
│
├── src/
│   ├── app/                # next router
│   │   ├── layout.tsx      # root layout
│   │   ├── globals.css     # tailwind config
│   │   └── ...
│   │
│   ├── lib/                # general shared code
│   │   ├── controllers/    # data controllers
│   │   ├── hooks/          # custom hooks
│   │   ├── types.ts        # type definitions
│   │   └── ...             # other
│   │
│   ├── db/                 # database
│   │   ├── index.ts        # database instance
│   │   ├── schema.ts       # database schema
│   │
│   ├── scraper/            # scraper
│   │   ├── main.ts         # scraper entry point
│   │   └── ...
│   │
│   └── components/         # react components
│       ├── ui/             # base components
│       │   ├── button.tsx
│       │   ├── input.tsx
│       │   └── ...
│       │
│       ├── icons/          # icon assets
│       │   ├── search.tsx
│       │   └── ...
│       │
│       └── ...             # other general components
```

## development

this project uses the `pnpm` package manager. ensure it is installed, then run
`pnpm install` to install the dependencies. copy the `.env.example` to `.env`
and fill them it. then run `pnpm dev` to start the development server.
