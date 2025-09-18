"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useContainerQuery } from "@/hooks/use-container-query";
import { useHydration } from "@/hooks/use-hydration";
import { remToPx } from "@/lib/utils";
import { MAX_MEAL_SEARCH_CALORIES, MealSearch, MealSearchSchema } from "@/lib/zod/meal";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search } from "lucide-react";
import { parseAsIndex, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { memo, useMemo } from "react";
import { Control, useForm, UseFormRegister, UseFormSetValue, useWatch } from "react-hook-form";

const FORM_BREAKPOINT = 36;

export default function SearchBar() {
  const hydrated = useHydration();
  const [ref, matches] = useContainerQuery<HTMLFormElement>({
    condition: ({ width }) => width >= remToPx(FORM_BREAKPOINT - 2)
  });
  const [,setParams] = useQueryStates({
    page: parseAsIndex.withDefault(0),
    query: parseAsString.withDefault(""),
    maxCalories: parseAsInteger.withDefault(0)
  });

  const {
    register,
    control,
    setValue,
    handleSubmit
  } = useForm({
    resolver: zodResolver(MealSearchSchema),
    defaultValues: {
      query: "",
      maxCalories: 0
    }
  });

  const onSubmit = useMemo(() => handleSubmit((data) => {
    setParams({
      query: data.query || null,
      maxCalories: data.maxCalories || null,
      page: 0
    }, {
      shallow: false,
      throttleMs: 500
    });
  }), [handleSubmit, setParams]);

  return (
    <Popover>
      <form
        ref={ref}
        onSubmit={onSubmit}
        className="w-full flex flex-col items-start gap-3"
      >
        <div className="w-full flex justify-between items-center gap-3">
          <Input 
            placeholder="Meal Query"
            {...register("query")}
            className="rounded-sm shadow-none"
          />
          <button
            type="submit"
            className="h-9 mealicious-button font-semibold text-sm flex items-center gap-2 px-4 rounded-sm"
          >
            <span className="hidden @min-2xl:inline">Search</span>
            <Search size={16}/>
          </button>
        </div>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full @min-xl:w-fit cursor-pointer gap-4 px-4! rounded-sm shadow-none">
            Search Options
            <Plus />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align={hydrated && matches ? "start" : "center"}
          sideOffset={remToPx(0.75)}
          className="w-[min(calc(100vw-2rem),calc(32rem+2rem))] p-0"
          asChild
        >
          <div className="grid">
            <h1 className="font-bold text-lg p-4">Advanced Search Options</h1>
            <Separator />
            <div className="grid gap-3 p-4">
              <MaxCalories 
                register={register}
                control={control}
                setValue={setValue}
              />
            </div>
          </div>
        </PopoverContent>
      </form>
    </Popover>
  );
}

const MaxCalories = memo(({
  control,
  register,
  setValue
}: {
  control: Control<MealSearch>;
  register: UseFormRegister<MealSearch>;
  setValue: UseFormSetValue<MealSearch>;
}) => {
  const currentMaxCalories = useWatch({ control, name: "maxCalories" });
  
  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between items-end gap-3">
        <h2 className="font-bold text-lg">Max Calories</h2>
        <Input 
          type="number"
          {...register("maxCalories", {
            setValueAs: (val) => Math.min(Math.max(0, Number(val)), MAX_MEAL_SEARCH_CALORIES)
          })}
          value={currentMaxCalories}
          className="w-22 font-semibold border border-border flex bg-sidebar text-center text-sm py-1.5 rounded-sm shadow-none"
        />
      </div>
      <Slider
        value={[currentMaxCalories]}
        onValueChange={(val) => setValue("maxCalories", val[0])}
        min={0}
        max={MAX_MEAL_SEARCH_CALORIES}
        step={10}
        className="my-1.5"
      />
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">0</h3>
        <h3 className="font-semibold">{MAX_MEAL_SEARCH_CALORIES}</h3>
      </div>
    </div>
  );
});

MaxCalories.displayName = "MaxCalories";
