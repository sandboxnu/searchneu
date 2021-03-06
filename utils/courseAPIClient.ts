import { GraphQLClient } from 'graphql-request';
import { getSdk } from '../generated/graphql';

const ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;

// GraphQL codegen creates a typed SDK by pulling out all operations in *.graphql files in the project.
// Run `yarn generate:graphql` to regenerate the client, or let `yarn dev` auto regen constantly.
export const gqlClient = getSdk(new GraphQLClient(ENDPOINT));
