"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn, MAX_GRID_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";
import { Info, SearchX } from "lucide-react";
import RecipeResult from "@/components/recipes/search/recipe-result";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getInfiniteSearchedRecipes } from "@/lib/actions/recipe";
import { useEffect, useMemo, useRef } from "react";

type SearchResultsProps = {
  userId: string;
  query: string;
  cuisine?: string;
  diet?: string;
  dishType?: string;
  isUsingCuisinePreferences: boolean;
  isUsingDietPreferences: boolean;
  isUsingDishTypePreferences: boolean;
};

export default function SearchResults({
  userId,
  query,
  cuisine,
  diet,
  dishType,
  isUsingCuisinePreferences,
  isUsingDietPreferences,
  isUsingDishTypePreferences
}: SearchResultsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const {
    data,
    fetchNextPage: loadMoreSearchedRecipes,
    isFetchingNextPage: searchedRecipesNextPageLoading,
    isFetchNextPageError: moreSearchedRecipesErrored,
    hasNextPage: hasMoreSearchedRecipes,
    isLoading: searchedRecipesLoading,
    isError: searchedRecipesErrored
  } = useInfiniteQuery({
    queryKey: [
      "search-recipes-results",
      userId,
      query,
      cuisine,
      diet,
      dishType,
      isUsingCuisinePreferences,
      isUsingDietPreferences,
      isUsingDishTypePreferences
    ],
    queryFn: ({ pageParam }) => getInfiniteSearchedRecipes({
      userId,
      query,
      cuisine,
      diet,
      dishType,
      isUsingCuisinePreferences,
      isUsingDietPreferences,
      isUsingDishTypePreferences,
      limit: MAX_GRID_RECIPE_DISPLAY_LIMIT,
      offset: pageParam * MAX_GRID_RECIPE_DISPLAY_LIMIT
    }),
    getNextPageParam: (lastPageData, _allPagesData, lastPageParam) => lastPageData.length > 0 ? lastPageParam + 1 : null,
    initialPageParam: 0,
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  const searchedRecipes = useMemo(
    () => data?.pages.flat(),
    [data?.pages]
  );

  const canLoadMoreSearchedRecipes = hasMoreSearchedRecipes
    && !searchedRecipesLoading
    && !searchedRecipesErrored
    && !searchedRecipesNextPageLoading
    && !moreSearchedRecipesErrored;

  useEffect(() => {
    if (!canLoadMoreSearchedRecipes || !sentinelRef.current) return;
    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver(([{ intersectionRatio }]) => {
      if (intersectionRatio > 0)
        loadMoreSearchedRecipes();
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canLoadMoreSearchedRecipes, loadMoreSearchedRecipes]);

  if (searchedRecipesErrored && !moreSearchedRecipesErrored) {
    return (
      <div className="error-label flex items-center gap-2 p-2">
        <Info size={16}/>
        There was an error while fetching recipes content.
      </div>
    );
  }

  if (searchedRecipesLoading || !searchedRecipes) {
    return (
      <div className="flex-1 w-full flex flex-col gap-3">
        <Skeleton className="w-56 h-9 rounded-sm"/>
        <Skeleton className="w-82 h-6 rounded-sm"/>
        <div className="grid grid-cols-1 @min-2xl:grid-cols-2 @min-5xl:grid-cols-3 gap-4 @min-2xl:gap-6">
          {
            Array.from({ length: MAX_GRID_RECIPE_DISPLAY_LIMIT }, (_, i) => i).map((i) => (
              <Skeleton key={i} className="h-125 @min-2xl:h-108"/>
            ))
          }
        </div>
      </div>
    );
  }

  if (searchedRecipes.length <= 0) {
    return (
      <div className="flex-1 @min-2xl:flex-none w-full bg-sidebar border border-border rounded-md flex flex-col justify-center items-center gap-8 px-4 py-12 mx-auto">
        <SearchX size={60} className="stroke-muted-foreground"/>
        <div className="flex flex-col items-center gap-2">
          <h3 className="font-bold text-lg mt-auto">No Recipe Found!</h3>
          <span className="font-semibold text-center text-muted-foreground">Try making another search or start creating one!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-1.5">
      <h2 className="font-bold text-2xl text-left">
        Search Results
      </h2>
      <div className="grid grid-cols-1 @min-2xl:grid-cols-2 @min-5xl:grid-cols-3 gap-4 @min-2xl:gap-6">
        {
          searchedRecipes.map((r) => (
            <RecipeResult 
              key={r.id}
              recipe={r}
              isUsingCuisinePreferences={isUsingCuisinePreferences}
              isUsingDietPreferences={isUsingDietPreferences}
              isUsingDishTypePreferences={isUsingDishTypePreferences}
            />
          ))
        }
        {
          searchedRecipesNextPageLoading && (
            <>
            {
              Array.from({ length: MAX_GRID_RECIPE_DISPLAY_LIMIT }, (_, i) => i).map((i) => (
                <Skeleton key={i}/>
              ))
            }
            </>
          )
        }
        {
          moreSearchedRecipesErrored && (
            <div className="error-label @min-2xl:col-span-2 @min-5xl:col-span-3 flex items-center gap-2 p-2">
              <Info size={16}/>
              There was an error while fetching additional recipes.
            </div>
          )
        }
      </div>
      {/* Used for infinite scrolling */}
      <div
        ref={sentinelRef}
        role="presentation"
        tabIndex={-1}
        aria-hidden
        className={cn(
          "w-full h-12",
          canLoadMoreSearchedRecipes ? "block" : "hidden"
        )}
      />
    </div>
  );
}
