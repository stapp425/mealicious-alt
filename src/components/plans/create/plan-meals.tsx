"use client";

import { getSavedMealsForPlanForm, getSavedMealsForPlanFormCount } from "@/lib/actions/plan";
import { cn, MAX_MEAL_RESULT_DISPLAY_LIMIT } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Flame, Info, Loader2, Plus, SearchX, Trash2, X } from "lucide-react";
import { ComponentProps, memo, useCallback, useMemo, useState } from "react";
import { useFormState, useWatch } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MealType, mealTypes } from "@/lib/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCreatePlanFormContext } from "@/components/plans/create/create-plan-form";
import { useQuery } from "@tanstack/react-query";
import { usePagination } from "@/hooks/use-pagination";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export type Meal = {
  id: string;
  title: string;
  calories: number;
  recipes: {
    id: string;
    title: string;
  }[];
};

type RecipeSearchProps = {
  userId: string;
};

export default function PlanMeals({ userId }: RecipeSearchProps) {
  const { control, setValue } = useCreatePlanFormContext();
  const planMealValues = useWatch({ control, name: "meals" });
  const {
    errors: {
      meals: mealsError
    }
  } = useFormState({ control, name: "meals" });
  
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 500);

  const mealTypesDifference = useMemo(
    () => {
      const planMealTypesSet = new Set(Object.keys(planMealValues));
      return mealTypes.filter((mt) => !planMealTypesSet.has(mt));
    },
    [planMealValues]
  );

  const canAddMeal = useCallback(
    (meal: Meal, mealType: MealType) => !Object.hasOwn(planMealValues, mealType) || planMealValues[mealType]?.id !== meal.id,
    [planMealValues]
  );
  
  const isEveryMealTypeFilled = Object.keys(planMealValues).length === mealTypes.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <section className="grid gap-1.5">
        <h1 className="text-2xl font-bold required-field">Meals</h1>
        <p className="font-semibold text-muted-foreground text-sm">
          Add meals to your plan here.
        </p>
        <DialogTrigger asChild>
          <button
            type="button"
            disabled={isEveryMealTypeFilled}
            className="mealicious-button font-semibold text-sm flex justify-center items-center gap-3 rounded-sm py-2 px-12 mb-1"
          >
            Add Meal
            <Plus size={16}/>
          </button>
        </DialogTrigger>
        <DialogContent className="p-0 gap-0 overflow-hidden" asChild>
          <div className="flex flex-col">
            <VisuallyHidden>
              <DialogHeader>
                <DialogTitle>
                  Meal Search
                </DialogTitle>
                <DialogDescription>
                  Search for meals to insert to the created plan.
                </DialogDescription>
              </DialogHeader>
            </VisuallyHidden>
            <div className="text-muted-foreground flex justify-between items-center py-2 px-4">
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Meal..."
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
            <PlanMealsBody 
              userId={userId}
              query={debouncedQuery}
              mealTypes={mealTypesDifference}
              canAddMeal={canAddMeal}
            />
          </div>
        </DialogContent>
        <ul className="peer/meal-list grid empty:hidden">
          {
            Object.entries(planMealValues).length > 0 && mealTypes.map((mt) => {
              const meal = planMealValues[mt];
              return meal ? (
                <li
                  key={mt}
                  className="flex items-start gap-2.5 sm:gap-4"
                >
                  <span className="min-w-24 bg-mealicious-primary text-white text-xs text-center font-semibold py-1.5 rounded-sm capitalize">
                    {mt}
                  </span>
                  <Separator orientation="vertical"/>
                  <div className="flex-1 grid items-start gap-3 pb-4.5">
                    <div className="w-full flex justify-between items-start gap-4">
                      <h2 className="font-bold line-clamp-2">{meal.title}</h2>
                      <button
                        type="button"
                        onClick={() => setValue(
                          "meals",
                          Object.entries(planMealValues).reduce((obj, prop) => {
                          const mealValue = planMealValues[prop[0] as MealType];
                          if (mealValue && prop[0] !== mt)
                            obj[prop[0] as MealType] = mealValue;
                          return obj;
                        }, {} as Record<MealType, Meal>)
                      )}
                        className="w-fit h-8 group cursor-pointer hover:bg-red-700 hover:text-white hover:border-red-700 border border-muted-foreground font-semibold text-xs text-nowrap flex justify-center items-center gap-1.5 py-2 px-3 rounded-full transition-colors"
                      >
                        Delete
                        <Trash2 size={16} className="shrink-0 stroke-muted-foreground group-hover:stroke-white"/>
                      </button>
                    </div>
                    <div className="group-disabled:text-muted text-muted-foreground font-semibold text-xs flex items-center gap-1">
                      <Flame size={16} className="fill-muted-foreground group-disabled:fill-muted"/>
                      <span>{Number(meal.calories).toLocaleString()} Calories</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {
                        meal.recipes.map((r) => (
                          <div key={r.id} className="bg-mealicious-primary text-white font-semibold text-xs text-nowrap max-w-48 @min-2xl:max-w-84 truncate rounded-full py-1 px-3">{r.title}</div>
                        ))
                      }
                    </div>
                  </div>
                </li>
              ) : null;
            })
          }
        </ul>
        <div className="hidden peer-empty/meal-list:flex w-full bg-sidebar border border-border rounded-md flex-col justify-center items-center gap-4 mx-auto mt-1 p-4">
          <SearchX size={60} className="stroke-muted-foreground"/>
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-lg mt-auto">No Meals Added</h3>
            <span className="font-semibold text-center text-muted-foreground">Try adding one!</span>
          </div>
        </div>
        <div className="error-text text-xs has-[>span:empty]:hidden">
          <Info size={14}/>
          <span>{mealsError?.message}</span>
        </div>
      </section>
    </Dialog>
  );
}

const PlanMealsBody = memo(({
  query = "",
  userId,
  canAddMeal,
  mealTypes,
  className,
  ...props
}: ComponentProps<"div"> & {
  query?: string;
  canAddMeal: (meal: Meal, mealType: MealType) => boolean;
  mealTypes: MealType[];
  userId: string;
}) => {
  const { setValue } = useCreatePlanFormContext();
  const [shouldShowMealRecipes, setShouldShowMealRecipes] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  
  const {
    data: mealResultsCount,
    isLoading: mealResultsCountLoading,
    isError: mealResultsCountErrored
  } = useQuery({
    queryKey: ["plan-form-meal-results", userId, query, { type: "count" }],
    queryFn: () => getSavedMealsForPlanFormCount({
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
    totalPages: Math.ceil((mealResultsCount ?? 0) / MAX_MEAL_RESULT_DISPLAY_LIMIT)
  });

  const {
    data: mealResults,
    isLoading: mealResultsLoading,
    isError: mealResultsErrored
  } = useQuery({
    queryKey: ["plan-form-meal-results", userId, query, currentPage],
    queryFn: () => getSavedMealsForPlanForm({
      userId,
      query,
      limit: MAX_MEAL_RESULT_DISPLAY_LIMIT,
      offset: currentPage * MAX_MEAL_RESULT_DISPLAY_LIMIT
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  if (mealResultsCountErrored || mealResultsErrored) {
    return (
      <div className="min-h-8 p-4">
        <div className="error-label flex items-center gap-2 p-2">
          <Info size={16}/>
          There was an error while fetching meals content.
        </div>
      </div>
    );
  }

  if (mealResultsLoading || mealResultsCountLoading || typeof mealResultsCount === "undefined" || !mealResults) {
    return (
      <div className="min-h-6 flex justify-center items-center">
        <Loader2 className="animate-spin m-auto my-3"/>
      </div>
    );
  }

  if (mealResultsCount <= 0) {
    return (
      <div className="p-4 overflow-x-hidden">
        <h1 className="text-center font-bold text-lg text-muted-foreground py-8">No meal found.</h1>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "grid",
        className
      )}
      {...props}
    >
      <div className="grid p-3">
        <h2 className="font-bold text-lg">Meal Results ({mealResultsCount})</h2>
        <div className="flex items-center gap-2 text-sm">
          <Info size={16}/>
          Select a meal type then include a meal.
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Checkbox
            id="show-recipes-checkbox"
            checked={shouldShowMealRecipes}
            onCheckedChange={(val) => setShouldShowMealRecipes(val === true)}
            className={cn(
              "rounded-xs shadow-none",
              className
            )}
          />
          <label
            htmlFor="show-recipes-checkbox"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Show Meal Recipes
          </label>
        </div>
        <ul className="grid gap-3 my-3">
          {
            mealResults.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  data-selected={m.id === selectedMeal?.id}
                  disabled={!selectedMealType || !canAddMeal(m, selectedMealType)}
                  onClick={() => setSelectedMeal(m.id === selectedMeal?.id ? null : m)}
                  className={cn(
                    "w-full border border-border grid group/meal cursor-pointer disabled:cursor-not-allowed text-left gap-2 p-3 rounded-sm transition-all",
                    "data-[selected=true]:border-mealicious-primary data-[selected=true]:bg-mealicious-primary/15"
                  )}
                >
                  <div className="flex justify-between items-start gap-3 overflow-hidden">
                    <h2 className="font-semibold truncate group-disabled/meal:text-muted-foreground -mb-1">{m.title}</h2>
                    <div className="hidden group-data-[selected=true]/meal:flex font-semibold text-xs items-center gap-1.75">
                      Selected
                      <div className="bg-mealicious-primary text-white size-5 flex justify-center items-center p-1 rounded-full">
                        <Check />
                      </div>
                    </div>
                  </div>
                  <div className="group-disabled:text-muted text-muted-foreground font-semibold text-xs flex items-center gap-1">
                    <Flame size={16} className="fill-muted-foreground group-disabled:fill-muted"/>
                    <span>{Number(m.calories).toLocaleString()} Calories</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 empty:hidden">
                    {
                      shouldShowMealRecipes && m.recipes.map((r) => (
                        <div key={r.id} className={cn(
                          "bg-mealicious-primary text-white font-semibold text-xs truncate rounded-full max-w-48 py-1 px-3",
                          "group-disabled/meal:bg-mealicious-primary-muted group-disabled/meal:dark:opacity-25"
                        )}>
                          {r.title}
                        </div>
                      ))
                    }
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
      <Separator />
      <div className="grid gap-3 p-3">
        {
          selectedMeal && (
            <div className="grid gap-1.5 overflow-hidden">
              <div className="flex font-semibold text-xs items-center gap-1.75">
                <div className="bg-mealicious-primary text-white size-5 flex justify-center items-center p-1 rounded-full">
                  <Check />
                </div>
                Selected Meal
              </div>
              <h2 className="font-semibold line-clamp-1 group-disabled:text-secondary -mb-1">{selectedMeal.title}</h2>
              <div className="group-disabled:text-muted text-muted-foreground font-semibold text-xs flex items-center gap-1">
                <Flame size={16} className="fill-muted-foreground group-disabled:fill-muted"/>
                <span>{Number(selectedMeal.calories).toLocaleString()} Calories</span>
              </div>
            </div>
          )
        }
        <div className="flex justify-between items-end gap-2">
          <Select value={selectedMealType || ""} onValueChange={(val: MealType) => setSelectedMealType(val)}>
            <SelectTrigger className="flex-1 capitalize rounded-sm shadow-none">
              <SelectValue placeholder="Select Meal Type..."/>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Types</SelectLabel>
                {
                  mealTypes.map((mt) => (
                    <SelectItem key={mt} value={mt} className="capitalize">
                      {mt}
                    </SelectItem>
                  ))
                }
              </SelectGroup>
            </SelectContent>
          </Select>
          <button
            type="button"
            disabled={!selectedMeal || !selectedMealType || !canAddMeal(selectedMeal, selectedMealType)}
            onClick={() => {
              if (!selectedMealType || !selectedMeal) return;
              setValue(
                `meals.${selectedMealType}`,
                {
                  id: selectedMeal.id,
                  title: selectedMeal.title,
                  calories: selectedMeal.calories,
                  recipes: selectedMeal.recipes
                }
              );
              setSelectedMealType(null);
              setSelectedMeal(null);
              toast.success("Meal successfully added!");
            }}
            className="flex-1 max-w-24 mealicious-button h-9 font-semibold text-sm rounded-sm"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
});

PlanMealsBody.displayName = "PlanMealsBody";
