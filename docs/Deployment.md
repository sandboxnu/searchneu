# Git branches and deploying to production

The master branch is the main branch for all the development. Merging into master deploys to searchneu.vercel.app. Releasing to searchneu.com must be done by merging `master` into the `prod` branch and pushing; this can only be done by someone on the team with admin privileges. Once changes in `prod` are pushed, Vercel will automatically deploy prod.

If the frontend has new environment variables, they can be set by going to Vercel -> Settings -> Environment Variables.

- Remember if any environment variable needs to be exposed to the browser (for example, the backend endpoint the browser hits), the variable should be prefixed with `NEXT_PUBLIC_`. See [Next.js environment variables](NEXT_PUBLIC_GRAPHQL_ENDPOINT).
