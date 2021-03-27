# Front-end only

If the GraphQL endpoint exposed by production `course-catalog-api` supports the query you want to make, you just have to:

1. Create a `.graphql` file somewhere in the project (it can be anywhere but we'd suggest the in `pages/api`) and write your GraphQL query (or edit an existing `.graphql` file to modify an existing query).
2. Run `yarn generate:graphql` to auto-generate types -- this will hit the production endpoint `https://api.searchneu.com`
   - running `yarn dev` also works since it runs the `generate:graphql` command
3. In your code, you can use `gqlClient` from `utils/courseAPIClient` to make the GraphQL query by doing something like
   `await gqlClient.whateverYouNamedYourQuery()`
4. Start up SearchNEU locally by running `yarn dev`

# Full-stack

If the GraphQL endpoint exposed by production `course-catalog-api` does NOT support the query you want to make, you have to:

1. Make changes to your local version of `course-catalog-api` so it supports your query
2. Start up `course-catalog-api` locally (it should run at `localhost:4000`)
3. Steps 1 and 3 from the front-end only flow are the same
4. Run `yarn generate:graphql:fullstack` to auto-generate types -- this will hit your local GraphQL endpoint which is `http://localhost:4000`. If it's not up, you'll get an error.
   - running `yarn dev:fullstack` also works since it will run `generate:graphql` with the local GraphQL endpoint
5. Start up SearchNEU locally by running `yarn dev:fullstack`

# Why does it work this way?

The GraphQL endpoint is currently used in 2 places in the code:

- In `codegen.yml` so when we run `yarn generate:graphql`, the codegen knows what endpoint to hit to generate types
- In `courseAPIClient.ts` so the `gqlClient` used in other places of our code knows what endpoint to hit when making GraphQL queries

This endpoint is an environment variable that we set in `.env.development`. By default, we have it pointing to our production endpoint `https://api.searchneu.com`. We can override this endpoint with `http://localhost:4000` by setting `NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000` when we run commands like `yarn dev` and `yarn generate:graphql`. In fact, this is exactly what `yarn dev:fullstack` and `yarn generate:graphql:fullstack` do!
