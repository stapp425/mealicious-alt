"use client";

import { getSavedMealsForPlanForm, getSavedMealsForPlanFormCount } from "@/lib/actions/plan";
import { MAX_MEAL_RESULT_DISPLAY_LIMIT } from "@/lib/utils";
import { EditPlanForm } from "@/lib/zod/plan";
import { Check, Flame, Info, Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/plans/edit/pagination";
import { MealType, mealTypes } from "@/lib/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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
  const { 
    control,
    setValue,
    formState: {
      errors
    }
  } = useFormContext<EditPlanForm>();
  const planMealValues = useWatch({ control, name: "meals" });
  
  const [open, setOpen] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [mealResults, setMealResults] = useState<Meal[]>([]);
  const [query, setQuery] = useState<string>("");
  const [mealResultsCount, setMealResultsCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);

  const mealTypesDifference = useMemo(
    () => {
      const planMealTypesSet = new Set(Object.keys(planMealValues));
      return mealTypes.filter((mt) => !planMealTypesSet.has(mt));
    },
    [planMealValues]
  );
  
  const isEveryMealTypeFilled = Object.keys(planMealValues).length === mealTypes.length;
  const totalPages = Math.ceil(mealResultsCount / MAX_MEAL_RESULT_DISPLAY_LIMIT);

  const debouncedFetchMealResults = useDebouncedCallback(() => {
    fetchMealResults();
    fetchMealResultsCount();
  }, 500);

  const fetchMealResults = () => startTransition(async () => {
    const meals = await getSavedMealsForPlanForm({
      userId,
      query,
      limit: MAX_MEAL_RESULT_DISPLAY_LIMIT,
      offset: page * MAX_MEAL_RESULT_DISPLAY_LIMIT
    });

    setMealResults(meals);
  });

  const fetchMealResultsCount = () => startTransition(async () => {
    const [{ count }] = await getSavedMealsForPlanFormCount({
      userId,
      query
    });
    setMealResultsCount(count);
  });

  useEffect(() => {
    if (page !== 0) setPage(0);
    debouncedFetchMealResults();
  }, [query]);
  
  useEffect(() => {
    fetchMealResults();
  }, [page]);
  
  useEffect(() => {
    // Plan has all the meal types available
    if (isEveryMealTypeFilled) setOpen(false);
  }, [isEveryMealTypeFilled]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold required-field">Meals</h1>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
          <p className="font-semibold text-muted-foreground">
            Add meals to your plan here.
          </p>
        </div>
        <DialogTrigger asChild>
          <button
            type="button"
            disabled={isEveryMealTypeFilled}
            className="mealicious-button font-semibold text-sm flex justify-center items-center gap-3 rounded-sm py-2 px-12"
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
            <div className="flex flex-col gap-1.5 sm:gap-3 p-4">
              {
                isPending ? (
                  <div className="min-h-[50px] flex justify-center items-center">
                    <Loader2 className="animate-spin m-auto my-3"/>
                  </div>
                ) : (
                  <>
                  {
                    mealResults.length > 0 ? (
                      <>
                      <h2 className="font-bold text-lg">Meal Results ({mealResultsCount})</h2>
                      <Separator />
                      <div className="flex items-center gap-2 text-sm">
                        <Info size={16}/>
                        Select a meal then include a type.
                      </div>
                      <ul className="flex flex-col gap-3">
                        {
                          mealResults.map((m) => (
                            <li key={m.id} className="w-full">
                              <button
                                type="button"
                                data-selected={m.id === selectedMeal?.id}
                                disabled={isEveryMealTypeFilled}
                                onClick={() => setSelectedMeal(m.id === selectedMeal?.id ? null : m)}
                                className="w-full flex flex-col group/meal cursor-pointer disabled:cursor-not-allowed text-left gap-2 rounded-sm transition-all"
                              >
                                <div className="flex justify-between items-start gap-3">
                                  <h2 className="font-semibold line-clamp-1 group-disabled:text-secondary -mb-1">{m.title}</h2>
                                  <div className="hidden group-data-[selected=true]/meal:flex font-semibold text-xs items-center gap-1.75">
                                    <div className="bg-mealicious-primary text-white size-5 flex justify-center items-center p-1 rounded-full">
                                      <Check />
                                    </div>
                                    Selected
                                  </div>
                                </div>
                                <div className="group-disabled:text-muted text-muted-foreground font-semibold text-xs flex items-center gap-1">
                                  <Flame size={16} className="fill-muted-foreground group-disabled:fill-muted"/>
                                  <span>{Number(m.calories).toLocaleString()} Calories</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {
                                    m.recipes.map((r) => (
                                      <div key={r.id} className="group-disabled:bg-mealicious-primary-muted group-disabled:dark:opacity-25 bg-mealicious-primary text-white font-semibold text-xs rounded-full py-1 px-3">
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
                      <Pagination
                        pages={totalPages}
                        page={page}
                        setPage={setPage}
                      />
                      </>
                    ) : (
                      <h1 className="text-center font-bold text-lg text-muted-foreground py-8">No meal found.</h1>
                    )
                  }
                  </>
                )
              }
            </div>
            <Separator />
            <div className="flex justify-between items-end gap-2 p-3">
              <Select value={selectedMealType || ""} onValueChange={(val: MealType) => setSelectedMealType(val)}>
                <SelectTrigger className="flex-1 capitalize">
                  <SelectValue placeholder="Select Meal Type..."/>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Types</SelectLabel>
                    {
                      mealTypesDifference.map((mt) => (
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
                disabled={!selectedMeal || !selectedMealType || Object.hasOwn(planMealValues, selectedMealType)}
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
                  )
                  setSelectedMeal(null);
                  setSelectedMealType(null);
                  toast.success("Meal successfully added!");
                }}
                className="flex-1 max-w-[100px] mealicious-button h-9 font-semibold text-sm rounded-md"
              >
                Add
              </button>
            </div>
          </div>
        </DialogContent>
        {
          Object.entries(planMealValues).length > 0 && (
            <div className="grid">
              {
                mealTypes.map((mt) => {
                  const meal = planMealValues[mt];
                  return meal ? (
                    <div
                      key={mt}
                      className="flex items-start gap-2.5 sm:gap-4"
                    >
                      <span className="min-w-[100px] bg-mealicious-primary text-white text-xs text-center font-semibold py-1.5 rounded-sm capitalize">
                        {mt}
                      </span>
                      <Separator orientation="vertical"/>
                      <div className="flex-1 flex flex-col items-start gap-3 pb-4.5">
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
                              <div key={r.id} className="bg-mealicious-primary text-white font-semibold text-xs rounded-full py-1 px-3">{r.title}</div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  ) : null;
                })
              }
            </div>
          )
        }
        {
          errors.meals?.message && (
            <div className="error-text text-sm">
              <Info size={16}/>
              {errors.meals?.message}
            </div>
          )
        }
      </div>
    </Dialog>
  );
}
