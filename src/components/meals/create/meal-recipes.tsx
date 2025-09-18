"use client";

import { cn, MAX_RECIPE_RESULT_DISPLAY_LIMIT } from "@/lib/utils";
import { MAX_MEAL_RECIPES } from "@/lib/zod/meal";
import { ChevronLeft, ChevronRight, Info, Loader2, Plus, SearchX, Trash2, X } from "lucide-react";
import { ComponentProps, memo, useState } from "react";
import { useFieldArray, useFormState, useWatch } from "react-hook-form";
import { useDebounce } from "use-debounce";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getSavedRecipesForMealForm, getSavedRecipesForMealFormCount } from "@/lib/actions/meal";
import { useCreateMealFormContext } from "@/components/meals/create/create-meal-form";
import { useQuery } from "@tanstack/react-query";
import { usePagination } from "@/hooks/use-pagination";
import { Button } from "@/components/ui/button";

type RecipeSearchProps = {
  userId: string;
};

export default function MealRecipes({ userId }: RecipeSearchProps) {
  const { control } = useCreateMealFormContext();
  const { remove } = useFieldArray({ control, name: "recipes" });
  const mealRecipeValues = useWatch({ control, name: "recipes" });
  const {
    errors: {
      recipes: recipesError
    }
  } = useFormState({ control, name: "recipes" });
  
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [debouncedQuery] = useDebounce(query, 500);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <section className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold required-field">Recipes</h1>
        <div className="flex flex-col @min-2xl:flex-row justify-between items-start md:items-end">
          <p className="font-semibold text-muted-foreground text-sm">
            Add recipes to your meal here.
          </p>
          <span className={cn("shrink-0 text-sm", mealRecipeValues.length > MAX_MEAL_RECIPES && "text-red-500")}>
            <b className="text-base">{mealRecipeValues.length}</b> / {MAX_MEAL_RECIPES}
          </span>
        </div>
        <DialogTrigger asChild>
          <button
            disabled={mealRecipeValues.length >= MAX_MEAL_RECIPES}
            className="mealicious-button font-semibold text-sm flex justify-center items-center gap-3 rounded-sm p-2"
          >
            Add Recipe
            <Plus size={16}/>
          </button>
        </DialogTrigger>
        <DialogContent
          className="p-0 gap-0 overflow-hidden"
          asChild
        >
          <div className="flex flex-col">
            <VisuallyHidden>
              <DialogHeader>
                <DialogTitle>
                  Recipe Search
                </DialogTitle>
                <DialogDescription>
                  Search for recipes to insert to the created meal.
                </DialogDescription>
              </DialogHeader>
            </VisuallyHidden>
            <div className="text-muted-foreground flex justify-between items-center py-2 px-4">
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Recipe..."
                className="border-none bg-transparent! focus-visible:ring-0 p-0 shadow-none"
              />
              <X
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                }}
                strokeWidth={1.25}
                className="cursor-pointer"
              />
            </div>
            <Separator />
            <MealRecipesResults 
              userId={userId}
              query={debouncedQuery}
            />
          </div>
        </DialogContent>
        <ul className="peer/recipe-list empty:hidden flex flex-col gap-3 mt-1">
          {
            mealRecipeValues.map((r, index) => (
              <li
                key={r.id}
                className="border border-border w-full min-h-25 flex flex-col @min-2xl:flex-row gap-2.5 @min-2xl:gap-4 p-3 transition-colors rounded-sm"
              >
                <div className="relative w-full @min-2xl:w-36 h-48 @min-2xl:h-auto min-h-12 shrink-0">
                  <Image 
                    src={r.image}
                    alt={`Image of ${r.title}`}
                    fill
                    className="rounded-sm object-cover object-center"
                  />
                  <div className="absolute size-full bg-linear-to-t from-gray-700/25 from-5% to-white/0 to-50%"/>
                </div>
                <div className="flex-1 overflow-x-hidden text-left flex flex-col items-start gap-1.5">
                  <h2 className="font-bold line-clamp-2 -mb-0.5">{r.title}</h2>
                  <p className={cn(
                    r.description ? "line-clamp-1" : "italic",
                    "text-muted-foreground"
                  )}>
                    {r.description || "No description is available."}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="w-fit h-8 group cursor-pointer hover:bg-red-700 hover:text-white hover:border-red-700 border border-muted-foreground font-semibold text-xs text-nowrap flex justify-center items-center gap-1.5 py-2 px-3 rounded-full transition-colors"
                  >
                    Delete
                    <Trash2 size={16} className="shrink-0 stroke-muted-foreground group-hover:stroke-white"/>
                  </button>
                </div>
              </li>
            ))
          }
        </ul>
        <div className="hidden peer-empty/recipe-list:flex w-full bg-sidebar border border-border rounded-md flex-col justify-center items-center gap-4 mx-auto mt-1 p-4">
          <SearchX size={60} className="stroke-muted-foreground"/>
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-lg mt-auto">No Recipes Added</h3>
            <span className="font-semibold text-center text-muted-foreground">Try adding one!</span>
          </div>
        </div>
        <div className="error-text text-xs has-[>span:empty]:hidden">
          <Info size={14}/>
          <span>{recipesError?.message}</span>
        </div>
      </section>
    </Dialog>
  );
}

const MealRecipesResults = memo(({
  query = "",
  userId,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  query?: string;
  userId: string;
}) => {
  const { control } = useCreateMealFormContext();
  const { append } = useFieldArray({ control, name: "recipes" });
  const mealRecipeValues = useWatch({ control, name: "recipes" });

  const {
    data: recipeResultsCount,
    isLoading: recipeResultsCountLoading,
    isError: recipeResultsCountErrored
  } = useQuery({
    queryKey: ["meal-form-recipes", { type: "count" }, query],
    queryFn: () => getSavedRecipesForMealFormCount({
      userId,
      query
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  const {
    currentPage,
    isFirstPage,
    isLastPage,
    setToPage,
    incrementPage,
    decrementPage,
    list: paginationList
  } = usePagination({
    totalPages: Math.ceil((recipeResultsCount ?? 0) / MAX_RECIPE_RESULT_DISPLAY_LIMIT)
  });

  const {
    data: searchedRecipes,
    isLoading: recipeResultsLoading,
    isError: recipeResultsErrored
  } = useQuery({
    queryKey: ["meal-form-recipes", query, currentPage],
    queryFn: () => getSavedRecipesForMealForm({
      userId,
      query,
      limit: MAX_RECIPE_RESULT_DISPLAY_LIMIT,
      offset: currentPage * MAX_RECIPE_RESULT_DISPLAY_LIMIT
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  if (recipeResultsCountErrored || recipeResultsErrored) {
    return (
      <div className="min-h-8 p-4">
        <div className="error-label flex items-center gap-2 p-2">
          <Info size={16}/>
          There was an error while fetching recipes content.
        </div>
      </div>
    );
  }

  if (recipeResultsLoading || recipeResultsCountLoading || typeof recipeResultsCount === "undefined" || !searchedRecipes) {
    return (
      <div className="min-h-6 flex justify-center items-center">
        <Loader2 className="animate-spin m-auto my-3"/>
      </div>
    );
  }

  if (recipeResultsCount <= 0) {
    return (
      <div
        className={cn(
          "p-4 overflow-x-hidden",
          className
        )}
      >
        <h1 className="text-center font-bold text-lg text-muted-foreground py-8">No recipe found.</h1>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "grid gap-3 p-4 overflow-x-hidden",
        className
      )}
      {...props}
    >
      <h2 className="font-bold text-lg -mb-0.5">Recipe Results ({recipeResultsCount})</h2>
      {
        mealRecipeValues.length >= MAX_MEAL_RECIPES && (
          <div className="error-label text-sm flex items-center gap-2 p-2">
            <Info size={14}/>
            You have added the maximum recipe amount of {MAX_MEAL_RECIPES}.
          </div>
        )
      }
      <ul className="grid gap-6">
        {
          searchedRecipes.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                disabled={mealRecipeValues.some((fr) => fr.id === r.id)}
                onClick={() => {
                  if (mealRecipeValues.length >= MAX_MEAL_RECIPES) {
                    toast.error("You have already added the maximum number of recipes.");
                    return;
                  }
                  
                  append(r);
                  toast.success("Recipe successfully added!");
                }}
                className="group/recipe cursor-pointer disabled:cursor-not-allowed text-left w-full grid grid-cols-[4.5rem_1fr] items-center gap-4 rounded-sm"
              >
                <div className="relative min-h-12 h-auto shrink-0">
                  <Image 
                    src={r.image}
                    alt={`Image of ${r.title}`}
                    fill
                    className="rounded-sm object-cover object-center group-disabled/recipe:opacity-25"
                  />
                  <div className="absolute size-full bg-linear-to-t from-gray-700/25 from-5% to-white/0 to-50%"/>
                </div>
                <div className="overflow-hidden flex flex-col items-start">
                  <h2 className="font-semibold line-clamp-1 group-disabled/recipe:text-secondary">{r.title}</h2>
                  <p className={cn(
                    r.description ? "line-clamp-1" : "italic",
                    "text-muted-foreground group-disabled/recipe:text-secondary"
                  )}>
                    {r.description || "No description is available."}
                  </p>
                </div>
              </button>
            </li>
          ))
        }
      </ul>
      <div className="flex items-end h-10 gap-3 mx-auto">
        <Button
          variant="ghost"
          disabled={isFirstPage}
          onClick={decrementPage}
          className="cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft />
        </Button>
        {
          paginationList.map((p, i) => p === "..." ? (
            <span key={i} className="text-muted-foreground">
              ...
            </span>
          ) : (
            <button
              key={`page-${p}`}
              onClick={() => setToPage(p - 1)}
              disabled={p - 1 === currentPage}
              className={cn(
                p - 1 === currentPage ? "border-mealicious-primary bg-mealicious-primary text-white" : "border-secondary-foreground text-secondary-foreground",
                "border cursor-pointer disabled:cursor-not-allowed text-sm h-full flex justify-center items-center min-w-6 font-semibold px-3 rounded-sm transition-colors"
              )}
            >
              {p}
            </button>
          ))
        }
        <Button
          variant="ghost"
          disabled={isLastPage}
          onClick={incrementPage}
          className="cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
});

MealRecipesResults.displayName = "MealRecipesResults";
