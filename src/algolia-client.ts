import { createLocalStorageRecentSearchesPlugin } from "@algolia/autocomplete-plugin-recent-searches";

const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
  key: 'recentRecipeSearches',
  limit: 4,
});

export const recentSearchesPluginData = recentSearchesPlugin.data;

export async function getRecentSearchesData() {
  const recentSearchesData = await recentSearchesPluginData?.getAll();
  if (!recentSearchesData) return [];

  return recentSearchesData.map((data) => ({
    id: data.id,
    label: data.label,
    category: data.category
  }));
}

export function addRecentSearchData(props: { id: string; label: string, isQuery?: boolean }) {
  if (!recentSearchesPluginData)
    return false;
  
  recentSearchesPluginData.addItem({
    id: props.id,
    label: props.label,
    category: props.isQuery ? "query" : undefined
  });

  return true;
}

export function removeRecentSearchData(id: string) {
  if (!recentSearchesPluginData)
    return false;
  
  recentSearchesPluginData.removeItem(id);
  return true;
}
