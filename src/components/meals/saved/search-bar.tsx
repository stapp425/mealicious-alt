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
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
    reset
  } = useForm<MealSearch>({
    resolver: zodResolver(MealSearchSchema),
    defaultValues: {
      query: "",
      maxCalories: 0
    }
  });

  const [currentQuery, currentMealType, currentMaxCalories] = useWatch({ control, name: ["query", "mealType", "maxCalories"] });
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
            placeholder="Meal Title (optional)"
            {...register("query")}
          />
          <button
            type="submit"
            className="h-9 mealicious-button font-semibold text-sm flex items-center gap-2 px-4 rounded-md"
          >
            Search
            <Search size={16}/>
          </button>
        </div>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-fit cursor-pointer gap-4 px-4!">
            Search Options
            <Plus />
          </Button>
        </PopoverTrigger>
        <PopoverContent asChild align={mounted && matches ? "start" : "center"} sideOffset={12.5} className="w-[clamp(300px,calc(100vw-30px),475px)] p-0">
          <div className="flex flex-col">
            <h1 className="font-bold text-lg p-4">Advanced Search Options</h1>
            <Separator />
            <div className="flex flex-col gap-3 p-4">
              <div className="flex flex-col gap-2">
                <h2 className="font-bold text-lg">Meal Type</h2>
                <Select value={currentMealType || ""} onValueChange={(val) => setValue("mealType", val as MealType)}>
                  <SelectTrigger className="w-full">
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
              <div className="flex flex-col gap-2">
                <h2 className="font-bold text-lg">Max Calories</h2>
                <h3 className="w-fit font-semibold border border-border bg-sidebar text-sm py-1.5 px-4 mb-2 rounded-sm">{currentMaxCalories}</h3>
                <Slider
                  value={[currentMaxCalories]}
                  onValueChange={(val) => setValue("maxCalories", val[0])}
                  min={0}
                  max={MAX_MEAL_SEARCH_CALORIES}
                  step={10}
                />
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">0</h3>
                  <h3 className="font-semibold">{MAX_MEAL_SEARCH_CALORIES}</h3>
                </div>
              </div>
              <Button 
                variant="link"
                type="button"
                onClick={() => {
                  reset({ query: currentQuery, maxCalories: 0 });
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
