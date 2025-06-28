"use client";

import { getSavedMealsForPlanForm, getSavedMealsForPlanFormCount } from "@/lib/actions/db";
import { cn, MAX_MEAL_RESULT_DISPLAY_LIMIT } from "@/lib/utils";
import { MAX_PLAN_MEALS, PlanCreation } from "@/lib/zod";
import { Flame, Info, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/plans/create/pagination";
import TimePicker from "./time-picker";
import { differenceInMinutes, format, startOfDay } from "date-fns";
import { MealType } from "@/lib/types";

export type Meal = {
  id: string;
  title: string;
  type: MealType;
  calories: number;
  recipes: {
    id: string;
    title: string;
  }[];
};

type RecipeSearchProps = {
  userId: string;
};

export default function PlanMealSearch({ userId }: RecipeSearchProps) {
  const { control, formState: { errors } } = useFormContext<PlanCreation>();
  const { remove } = useFieldArray({ control, name: "meals" });
  const planMealValues = useWatch({ control, name: "meals" });
  
  const [open, setOpen] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [mealResults, setMealResults] = useState<Meal[]>([]);
  const [query, setQuery] = useState<string>("");
  const [mealResultsCount, setMealResultsCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [time, setTime] = useState<Date>(startOfDay(new Date()));

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
    if (planMealValues.length >= MAX_PLAN_MEALS)
      setOpen(false);
  }, [planMealValues]);

  const totalPages = Math.ceil(mealResultsCount / MAX_MEAL_RESULT_DISPLAY_LIMIT);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold required-field">Meals</h1>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
          <p className="font-semibold text-muted-foreground">
            Add meals to your plan here.
          </p>
          <span className={cn(planMealValues.length > MAX_PLAN_MEALS && "text-red-500")}>
            <b className="text-xl">{planMealValues.length}</b> / {MAX_PLAN_MEALS}
          </span>
        </div>
        <DialogTrigger asChild>
          <button
            disabled={planMealValues.length >= MAX_PLAN_MEALS}
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
                        Select a meal then include a time.
                      </div>
                      <ul className="flex flex-col gap-3">
                        {
                          mealResults.map((m) => (
                            <li key={m.id} className="w-full">
                              <button
                                type="button"
                                data-selected={m.id === selectedMeal?.id}
                                disabled={planMealValues.some((fm) => fm.id === m.id)}
                                onClick={() => setSelectedMeal(m.id === selectedMeal?.id ? null : m)}
                                className="group cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:p-2 disabled:cursor-not-allowed text-left w-full flex items-center gap-4 rounded-sm transition-all"
                              >
                                <div className="w-full flex flex-col items-start gap-2">
                                  <div className="w-full flex justify-between items-center gap-2">
                                    <h2 className="font-semibold line-clamp-1 group-disabled:text-secondary">{m.title}</h2>
                                    <h2 className="min-w-[100px] border border-border text-xs text-center font-semibold rounded-md py-1 px-5">
                                      {m.type.charAt(0).toUpperCase() + m.type.slice(1)}
                                    </h2>
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
            <TimePicker
              date={time}
              setDate={(date) => setTime(date || startOfDay(Date.now()))}
              selectedMeal={selectedMeal}
              setSelectedMeal={setSelectedMeal}
            />
          </div>
        </DialogContent>
        {
          planMealValues.length > 0 && (
            <>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Info size={16}/>
              You can remove a meal by clicking on it.
            </div>
            <div className="empty:hidden flex flex-col">
              {
                planMealValues.sort((a, b) => differenceInMinutes(a.time, b.time)).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => remove(planMealValues.indexOf(m))}
                    className="cursor-pointer w-full flex gap-4 rounded-sm"
                  >
                    <div className="text-left flex items-start gap-4">
                      <div className="min-w-[100px] flex flex-col gap-1.5 shrink-0 pb-4.5">
                        <h3 className="font-semibold">{format(m.time, "h:mm a")}</h3>
                        <span className="bg-mealicious-primary text-white text-xs text-center font-semibold py-1.5 rounded-sm">
                          {m.type.charAt(0).toUpperCase() + m.type.slice(1)}
                        </span>
                      </div>
                      <Separator orientation="vertical"/>
                      <div className="flex flex-col items-start gap-3 pb-4.5">
                        <h2 className="font-bold line-clamp-2">{m.title}</h2>
                        <div className="group-disabled:text-muted text-muted-foreground font-semibold text-xs flex items-center gap-1">
                          <Flame size={16} className="fill-muted-foreground group-disabled:fill-muted"/>
                          <span>{Number(m.calories).toLocaleString()} Calories</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {
                            m.recipes.map((r) => (
                              <div key={r.id} className="bg-mealicious-primary text-white font-semibold text-xs rounded-full py-1 px-3">{r.title}</div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              }
            </div>
            </>
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
