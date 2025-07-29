"use server";

import { searchClient, writeClient } from "@/lib/algolia";
import { 
  RecipeSearchIndexDeletionSchema,
  RecipeSearchIndexInsertionSchema,
  RecipeSearchIndexSchema
} from "@/lib/zod/recipe";
import { recentSearchesPluginData } from "@/lib/functions/algolia";

export async function searchForRecipesQueryIndices(query: string) {
  const response = await searchClient.search({
    requests: [{
      indexName: process.env.SEARCH_INDEXING_NAME!,
      query,
      hitsPerPage: 4
    }]
  });

  const { results } = RecipeSearchIndexSchema.parse(response);
  return results[0].hits;
}

export async function getRecentSearchesData() {
  const recentSearchesData = await recentSearchesPluginData?.getAll();
  if (!recentSearchesData) return [];

  return recentSearchesData.map((data) => ({
    id: data.id,
    label: data.label,
    category: data.category
  }));
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
