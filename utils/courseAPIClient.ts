import { GraphQLClient } from 'graphql-request';
import { getSdk } from '../generated/graphql';

const ENDPOINT = 'https://searchneu.com/graphql';

// GraphQL codegen creates a typed SDK by pulling out all operations in *.graphql files in the project.
// Run `yarn generate:graphql` to regenerate the client, or let `yarn dev` auto regen constantly.
export const gqlClient = getSdk(new GraphQLClient(ENDPOINT));
