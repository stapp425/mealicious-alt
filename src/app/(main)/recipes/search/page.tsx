import SearchResults from "@/components/recipes/search/search-results";
import SearchBar from "@/components/recipes/search/search-bar";
import { db } from "@/db";
import { SearchParams } from "nuqs";
import { parseAsString, parseAsIndex, createLoader } from "nuqs/server";
import { Separator } from "@/components/ui/separator";

const loadSearchParams = createLoader({
  query: parseAsString.withDefault(""),
  cuisine: parseAsString.withDefault(""),
  diet: parseAsString.withDefault(""),
  dishType: parseAsString.withDefault(""),
  page: parseAsIndex.withDefault(0)
});

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page({ searchParams }: PageProps) {
  const { query, cuisine, diet, dishType, page } = await loadSearchParams(searchParams);

  const dietsQuery = db.query.diet.findMany({
    columns: {
      id: true,
      name: true
    }
  });

  const dishTypesQuery = db.query.dishType.findMany({
    columns: {
      id: true,
      name: true
    }
  });

  const cuisinesQuery = db.query.cuisine.findMany({
    columns: {
      id: true,
      adjective: true,
      icon: true
    }
  });

  const [diets, dishTypes, cuisines] = await Promise.all([
    dietsQuery,
    dishTypesQuery,
    cuisinesQuery
  ]);
  
  return (
    <div className="flex-1 max-w-[750px] text-center sm:text-left w-full flex flex-col gap-4 p-4 mx-auto">
      <h1 className="font-bold text-4xl">Recipe Search</h1>
      <h2 className="font-semibold text-lg text-muted-foreground">Search your favorite recipes here!</h2>
      <SearchBar
        cuisines={cuisines}
        diets={diets}
        dishTypes={dishTypes}
      />
      <Separator />
      <SearchResults 
        query={query}
        cuisine={cuisine}
        diet={diet}
        dishType={dishType}
        page={page}
      />
    </div>
  );
}