import ResultOptions from "@/components/recipes/saved/result-options";
import SearchBar from "@/components/recipes/saved/search-bar";
import SearchResults from "@/components/recipes/saved/search-results";
import { Separator } from "@/components/ui/separator";
import { SearchParams } from "nuqs";
import { filters, sorts } from "@/lib/types";
import { 
  createLoader,
  parseAsString,
  parseAsStringLiteral,
  parseAsIndex,
  parseAsArrayOf
} from "nuqs/server";
import { Suspense } from "react";
import { Metadata } from "next";
import Pagination from "@/components/recipes/saved/pagination";
import { db } from "@/db";
import { and, count, eq, exists, ilike } from "drizzle-orm";
import { recipe, recipeFavorite, savedRecipe } from "@/db/schema";
import { MAX_LIST_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SearchResultsSkeleton from "@/components/recipes/saved/search-results-skeleton";
import { nanoid } from "nanoid";

type AllRecipesPageProps = {
  searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
  query: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(sorts),
  filters: parseAsArrayOf(parseAsStringLiteral(filters)).withDefault([]),
  page: parseAsIndex.withDefault(0)
});

export const metadata: Metadata = {
  title: "Saved Recipes | Mealicious",
  description: "View all your saved mealicious recipes here!"
};

export default async function Page({ searchParams }: AllRecipesPageProps) {
  const { filters, query, page, sort } = await loadSearchParams(searchParams);
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  
  const [{ count: savedRecipesCount }] = await db.select({ count: count() })
    .from(savedRecipe)
    .where(and(
      eq(savedRecipe.userId, userId),
      exists(
        db.select({ id: recipe.id })
          .from(recipe)
          .where(and(
            eq(savedRecipe.recipeId, recipe.id),
            ilike(recipe.title, `%${query}%`),
            filters.includes("created") ? eq(recipe.createdBy, userId) : undefined
          ))
      ),
      filters.includes("favorited") ?
        exists(
          db.select()
            .from(recipeFavorite)
            .where(and(
              eq(savedRecipe.userId, recipeFavorite.userId),
              eq(savedRecipe.recipeId, recipeFavorite.recipeId)
            ))
        )
      : undefined
    ));

  return (
    <div className="max-w-[850px] w-full flex-1 flex flex-col gap-2.5 mx-auto p-4">
      <h1 className="text-4xl font-bold mb-2">Saved Recipes</h1>
      <h2 className="font-bold">Search Recipe</h2>
      <SearchBar />
      <ResultOptions />
      <Separator />
      <Suspense key={nanoid()} fallback={<SearchResultsSkeleton />}>
        <SearchResults
          count={savedRecipesCount}
          userId={userId}
          searchParams={{ filters, query, page, sort }}
        />
      </Suspense>
      <Pagination totalPages={Math.ceil(savedRecipesCount / MAX_LIST_RECIPE_DISPLAY_LIMIT)}/>
    </div>
  );
}
