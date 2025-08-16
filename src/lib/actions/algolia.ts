"use server";

import { searchClient, writeClient } from "@/lib/algolia";
import { 
  RecipeSearchIndexDeletionSchema,
  RecipeSearchIndexInsertionSchema,
  RecipeSearchIndexSchema
} from "@/lib/zod/recipe";

export async function searchForRecipesQueryIndices(query: string) {
  const response = await searchClient.search({
    requests: [{
      indexName: process.env.SEARCH_INDEXING_NAME!,
      query,
      hitsPerPage: 4
    }]
  });

  const searchResults = RecipeSearchIndexSchema.parse(response);
  return searchResults;
}

export async function insertRecipeQueryIndex(props: { id: string; title: string; }) {
  const { objectID, title } = RecipeSearchIndexInsertionSchema.parse({
    objectID: props.id,
    title: props.title
  });
  
  await writeClient.addOrUpdateObject({
    indexName: process.env.SEARCH_INDEXING_NAME!,
    objectID,
    body: { title }
  });

  return {
    success: true as const,
    message: "Recipe query index successfully inserted!"
  };
}

export async function deleteRecipeQueryIndex(recipeId: string) {
  const { objectID } = RecipeSearchIndexDeletionSchema.parse({ objectID: recipeId });
  
  await writeClient.deleteObject({
    indexName: process.env.SEARCH_INDEXING_NAME!,
    objectID
  });

  return {
    success: true as const,
    message: "Recipe query index successfully deleted!"
  };
}
