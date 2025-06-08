import ResultOptions from "@/components/recipes/saved/result-options";
import SearchBar from "@/components/recipes/saved/search-bar";
import SearchResults from "@/components/recipes/saved/search-results";
import { Separator } from "@/components/ui/separator";
import { SearchParams } from "nuqs";
import { sorts, views } from "@/lib/types";
import { 
  createLoader,
  parseAsString,
  parseAsStringLiteral,
  parseAsIndex
} from "nuqs/server";
import { Suspense } from "react";

type AllRecipesPageProps = {
  searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
  query: parseAsString.withDefault(""),
  view: parseAsStringLiteral(views).withDefault("list"),
  sort: parseAsStringLiteral(sorts).withDefault("none"),
  page: parseAsIndex.withDefault(0)
});

export default async function Page({ searchParams }: AllRecipesPageProps) {
  const { query, sort, view, page } = await loadSearchParams(searchParams);

  return (
    <div className="max-w-[850px] w-full flex-1 flex flex-col gap-2.5 mx-auto p-4">
      <h1 className="text-4xl font-bold mb-2">All Recipes</h1>
      <h2 className="font-bold">Search Recipe</h2>
      <SearchBar />
      <ResultOptions />
      <Separator />
      <Suspense fallback={<h1>Loading...</h1>}>
        <SearchResults
          query={query}
          sort={sort}
          view={view}
          page={page}
        />
      </Suspense>
    </div>
  );
}