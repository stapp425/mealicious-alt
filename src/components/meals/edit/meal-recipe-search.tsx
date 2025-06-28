"use client";

import { getSavedRecipesForMealForm, getSavedRecipesForMealFormCount } from "@/lib/actions/db";
import { cn, MAX_RECIPE_RESULT_DISPLAY_LIMIT } from "@/lib/utils";
import { MAX_MEAL_RECIPES, MealEdition } from "@/lib/zod";
import { Info, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Pagination from "@/components/meals/edit/pagination";

type Recipe = {
  id: string;
  title: string;
  image: string;
  description: string | null;
};

type RecipeSearchProps = {
  userId: string;
};

export default function MealRecipeSearch({ userId }: RecipeSearchProps) {
  const { control, formState: { errors } } = useFormContext<MealEdition>();
  const { append, remove } = useFieldArray({ control, name: "recipes" });
  const mealRecipeValues = useWatch({ control, name: "recipes" });
  
  const [open, setOpen] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [recipeResults, setRecipeResults] = useState<Recipe[]>([]);
  const [query, setQuery] = useState<string>("");
  const [recipeResultsCount, setRecipeResultsCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const debouncedFetchRecipeResults = useDebouncedCallback(() => {
    fetchRecipeResults();
    fetchRecipeResultsCount();
  }, 500);

  const fetchRecipeResults = () => startTransition(async () => {
    const [{ recipes }] = await getSavedRecipesForMealForm({
      userId,
      query,
      limit: MAX_RECIPE_RESULT_DISPLAY_LIMIT,
      offset: page * MAX_RECIPE_RESULT_DISPLAY_LIMIT
    });
    setRecipeResults(recipes);
  });

  const fetchRecipeResultsCount = () => startTransition(async () => {
    const [{ count }] = await getSavedRecipesForMealFormCount({
      userId,
      query
    });
    setRecipeResultsCount(count);
  });

  useEffect(() => {
    if (page !== 0) setPage(0);
    debouncedFetchRecipeResults();
  }, [query]);
  
  useEffect(() => {
    fetchRecipeResults();
  }, [page]);

  useEffect(() => {
    if (mealRecipeValues.length >= MAX_MEAL_RECIPES)
      setOpen(false);
  }, [mealRecipeValues]);

  const totalPages = Math.ceil(recipeResultsCount / MAX_RECIPE_RESULT_DISPLAY_LIMIT);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold required-field">Recipes</h1>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
          <p className="font-semibold text-muted-foreground">
            Add recipes to your meal here.
          </p>
          <span className={cn(mealRecipeValues.length > MAX_MEAL_RECIPES && "text-red-500")}>
            <b className="text-xl">{mealRecipeValues.length}</b> / {MAX_MEAL_RECIPES}
          </span>
        </div>
        <DialogTrigger asChild>
          <button
            disabled={mealRecipeValues.length >= MAX_MEAL_RECIPES}
            className="mealicious-button font-semibold text-sm flex justify-center items-center gap-3 rounded-sm py-2 px-12"
          >
            Add Recipe
            <Plus size={16}/>
          </button>
        </DialogTrigger>
        <DialogContent className="p-0 gap-0 overflow-hidden" asChild>
          <div className="flex flex-col">
            <VisuallyHidden>
              <DialogHeader>
                <DialogTitle>
                  Recipe Search
                </DialogTitle>
                <DialogDescription>
                  Search for Mealicious recipes that you know and love.
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
            <div className="flex flex-col gap-3 p-4">
              {
                isPending ? (
                  <div className="min-h-[50px] flex justify-center items-center">
                    <Loader2 className="animate-spin m-auto my-3"/>
                  </div>
                ) : (
                  <>
                  {
                    recipeResults.length > 0 ? (
                      <>
                      <h2 className="font-bold text-lg">Recipe Results ({recipeResultsCount})</h2>
                      <Separator />
                      <div className="flex items-center gap-2 text-sm">
                        <Info size={16}/>
                        You can add a recipe by clicking on it.
                      </div>
                      <ul className="flex flex-col gap-7">
                        {
                          recipeResults.map((r) => (
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
                                className="group cursor-pointer disabled:cursor-not-allowed text-left w-full flex items-center gap-4 rounded-sm"
                              >
                                <div className="relative w-[75px] min-h-[50px] h-auto shrink-0">
                                  <Image 
                                    src={r.image}
                                    alt={`Image of ${r.title}`}
                                    fill
                                    className="rounded-sm object-cover object-center group-disabled:opacity-25"
                                  />
                                </div>
                                <div className="flex flex-col items-start grow-0">
                                  <h2 className="font-semibold line-clamp-1 group-disabled:text-secondary">{r.title}</h2>
                                  <p className={cn(
                                    r.description ? "line-clamp-1" : "italic",
                                    "text-muted-foreground group-disabled:text-secondary"
                                  )}>
                                    {r.description || "No description is available."}
                                  </p>
                                </div>
                              </button>
                            </li>
                          ))
                        }
                      </ul>
                      <Pagination
                        pages={totalPages}
                        page={page}
                        setPage={setPage}
                      />
                      </>
                    ) : (
                      <h1 className="text-center font-bold text-lg text-muted-foreground py-8">No recipe found.</h1>
                    )
                  }
                  </>
                )
              }
            </div>
          </div>
        </DialogContent>
        {
          mealRecipeValues.length > 0 && (
            <>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Info size={16}/>
              You can remove a recipe by clicking on it.
            </div>
            <div className="empty:hidden flex flex-col gap-3">
              {
                mealRecipeValues.map((r, index) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => remove(index)}
                    className="cursor-pointer border border-border w-full hover:border-red-500 hover:bg-red-300 dark:hover:bg-red-500 flex gap-4 p-3 transition-colors rounded-sm"
                  >
                    <div className="relative w-[100px] min-h-[50px] shrink-0">
                      <Image 
                        src={r.image}
                        alt={`Image of ${r.title}`}
                        fill
                        className="rounded-sm object-cover object-center"
                      />
                    </div>
                    <div className="text-left flex flex-col items-start gap-2">
                      <h2 className="font-bold line-clamp-2">{r.title}</h2>
                      <p className={cn(
                        r.description ? "line-clamp-1" : "italic",
                        "text-muted-foreground"
                      )}>
                        {r.description || "No description is available."}
                      </p>
                    </div>
                  </button>
                ))
              }
            </div>
            </>
          )
        }
        {
          errors.recipes?.message && (
            <div className="error-text text-sm">
              <Info size={16}/>
              {errors.recipes?.message}
            </div>
          )
        }
      </div>
    </Dialog>
  );
}
