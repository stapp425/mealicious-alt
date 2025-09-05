"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { MealType, mealTypes } from "@/lib/types";
import { MAX_MEAL_SEARCH_CALORIES, MealSearch, MealSearchSchema } from "@/lib/zod/meal";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search } from "lucide-react";
import { parseAsIndex, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { memo, useEffect, useState } from "react";
import { Control, useForm, UseFormRegister, UseFormSetValue, useWatch } from "react-hook-form";
import { useMediaQuery } from "usehooks-ts";

export default function SearchBar() {
  const [mounted, setMounted] = useState<boolean>(false);
  const matches = useMediaQuery("(min-width: 48rem)");
  const [,setParams] = useQueryStates({
    page: parseAsIndex.withDefault(0),
    query: parseAsString.withDefault(""),
    mealType: parseAsStringLiteral(mealTypes),
    maxCalories: parseAsInteger.withDefault(0)
  }, {
    shallow: false
  });

  const {
    register,
    control,
    setValue,
    handleSubmit,
    reset,
    watch
  } = useForm({
    resolver: zodResolver(MealSearchSchema),
    defaultValues: {
      query: "",
      maxCalories: 0
    }
  });

  const onSubmit = handleSubmit((data) => {
    setParams({
      ...data,
      page: 0
    });
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Popover>
      <form onSubmit={onSubmit} className="w-full flex flex-col items-start gap-3">
        <div className="w-full flex justify-between items-center gap-3">
          <Input 
            placeholder="Meal Title"
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
          <Button variant="outline" className="w-full @min-2xl:w-fit cursor-pointer gap-4 px-4! rounded-sm shadow-none">
            Search Options
            <Plus />
          </Button>
        </PopoverTrigger>
        <PopoverContent asChild align={mounted && matches ? "start" : "center"} sideOffset={12.5} className="w-[clamp(300px,calc(100vw-30px),475px)] p-0">
          <div className="grid">
            <h1 className="font-bold text-lg p-4">Advanced Search Options</h1>
            <Separator />
            <div className="grid gap-3 p-4">
              <MealTypeSelect
                control={control}
                setValue={setValue}
              />
              <MaxCalories 
                register={register}
                control={control}
                setValue={setValue}
              />
              <Button 
                variant="link"
                type="button"
                onClick={() => {
                  reset({ query: watch("query"), maxCalories: 0 });
                  setParams({
                    page: 0,
                    maxCalories: 0,
                    mealType: null
                  });
                }}
                className="size-fit cursor-pointer text-red-500 p-0"
              >
                Clear All Options
              </Button>
            </div>
          </div>
        </PopoverContent>
      </form>
    </Popover>
  );
}

const MealTypeSelect = memo(({
  control,
  setValue
}: {
  control: Control<MealSearch>;
  setValue: UseFormSetValue<MealSearch>;
}) => {
  const currentMealType = useWatch({ control, name: "mealType" });
  
  return (
    <div className="grid gap-2">
      <h2 className="font-bold text-lg">Meal Type</h2>
      <Select value={currentMealType || ""} onValueChange={(val) => setValue("mealType", val as MealType)}>
        <SelectTrigger className="capitalize w-full rounded-sm shadow-none">
          <SelectValue placeholder="Select Meal Type..."/>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Meal Types</SelectLabel>
            {
              mealTypes.map((m) => (
                <SelectItem key={m} value={m} className="capitalize">
                  {m}
                </SelectItem>
              ))
            }
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
});

MealTypeSelect.displayName = "MealTypeSelect";

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
      <div className="flex justify-between items-center gap-3">
        <h2 className="font-bold text-lg">Max Calories</h2>
        <Input 
          type="number"
          {...register("maxCalories", {
            setValueAs: (val) => Math.min(Math.max(0, Number(val)), MAX_MEAL_SEARCH_CALORIES)
          })}
          value={currentMaxCalories}
          className="w-22 font-semibold border border-border flex bg-sidebar text-center text-sm py-1.5 mb-2 rounded-sm shadow-none"
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
