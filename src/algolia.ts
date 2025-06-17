import { algoliasearch } from "algoliasearch";

export const searchClient = algoliasearch(
  process.env.SEARCH_INDEXING_APP_ID!,
  process.env.SEARCH_INDEXING_SEARCH_API_KEY!
);

export const writeClient = algoliasearch(
  process.env.SEARCH_INDEXING_APP_ID!,
  process.env.SEARCH_INDEXING_WRITE_API_KEY!
);
