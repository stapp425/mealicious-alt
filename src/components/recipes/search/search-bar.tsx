"use client";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RecipeSearch, RecipeSearchSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsIndex, parseAsString, useQueryState, useQueryStates } from "nuqs";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "usehooks-ts";
import { useEffect, useState } from "react";

type SearchBarProps = {
  cuisines: {
    id: string;
    adjective: string;
    icon: string;
  }[];
  diets: {
    id: string;
    name: string;
  }[];
  dishTypes: {
    id: string;
    name: string;
  }[];
};

export default function SearchBar({ cuisines, diets, dishTypes }: SearchBarProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const matches = useMediaQuery("(min-width: 48rem)");
  const { replace } = useRouter();
  const [query, setQuery] = useQueryState(
    "query",
    parseAsString.withDefault("")
  );
  
  const [{ cuisine, diet, dishType }, setParams] = useQueryStates({
    cuisine: parseAsString,
    diet: parseAsString,
    dishType: parseAsString,
    page: parseAsIndex.withDefault(0)
  }, {
    shallow: false,
    throttleMs: 500
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: {
      isSubmitting,
      isValid
    }
  } = useForm<RecipeSearch>({
    resolver: zodResolver(RecipeSearchSchema),
    defaultValues: { 
      query,
      cuisine: cuisines.find((c) => c.adjective === cuisine),
      diet: diets.find((d) => d.name === diet),
      dishType: dishTypes.find((dt) => dt.name === dishType)
    }
  });

  const onSubmit = handleSubmit(({ query, cuisine, diet, dishType }) => {
    const searchParams = new URLSearchParams();

    if (query) searchParams.append("query", query);
    if (cuisine?.adjective) searchParams.append("cuisine", cuisine.adjective);
    if (diet?.name) searchParams.append("diet", diet.name);
    if (dishType?.name) searchParams.append("dishType", dishType.name);

    replace(`/recipes/search/?${searchParams.toString()}`);
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentCuisine = watch("cuisine");
  const currentDiet = watch("diet");
  const currentDishType = watch("dishType");
  
  return (
    <Popover>
      <form onSubmit={onSubmit} className="w-full flex flex-col items-start gap-3">
        <div className="w-full flex justify-between items-stretch gap-3">
          <Input 
            placeholder="Recipe Title (optional)"
            {...register("query", {
              onChange: (e) => setQuery(e.target.value)
            })}
          />
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="font-semibold text-sm mealicious-button flex items-center gap-3 px-4 rounded-sm"
          >
            <span className="hidden sm:block">Search</span>
            <Search size={14}/>
          </button>
        </div>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-fit cursor-pointer gap-4 px-4!">
            Advanced Filters
            <Plus />
          </Button>
        </PopoverTrigger>
        <div className="empty:hidden flex flex-wrap items-center gap-4">
          {
            cuisine && (
              <button
                onClick={() => {
                  reset({
                    query,
                    cuisine: undefined,
                    diet: diets.find((d) => d.name === diet),
                    dishType: dishTypes.find((dt) => dt.name === dishType)
                  });

                  setParams((p) => ({
                    ...p,
                    cuisine: null,
                    page: 0
                  }));
                }}
                className="mealicious-button font-semibold text-sm flex items-center gap-4 cursor-pointer py-1.5 px-4 rounded-md"
              >
                Cuisine: {cuisine}
                <X size={16}/>
              </button>
            )
          }
          {
            diet && (
              <button
                onClick={() => {
                  reset({
                    query,
                    cuisine: cuisines.find((c) => c.adjective === cuisine),
                    diet: undefined,
                    dishType: dishTypes.find((dt) => dt.name === dishType)
                  });

                  setParams((p) => ({
                    ...p,
                    diet: null,
                    page: 0
                  }));
                }}
                className="mealicious-button font-semibold text-sm flex items-center gap-4 cursor-pointer py-1.5 px-4 rounded-md"
              >
                Diet: {diet}
                <X size={16}/>
              </button>
            )
          }
          {
            dishType && (
              <button
                onClick={() => {
                  reset({
                    query,
                    cuisine: cuisines.find((c) => c.adjective === cuisine),
                    diet: diets.find((d) => d.name === diet),
                    dishType: undefined
                  });

                  setParams((p) => ({
                    ...p,
                    dishType: null,
                    page: 0
                  }));
                }}
                className="mealicious-button font-semibold text-sm flex items-center gap-4 cursor-pointer py-1.5 px-4 rounded-md"
              >
                Dish Type: {dishType}
                <X size={16}/>
              </button>
            )
          }
        </div>
        <PopoverContent asChild align={mounted && matches ? "start" : "center"} sideOffset={12.5} className="w-[clamp(300px,calc(100vw-30px),475px)] p-0">
          <div className="flex flex-col">
            <h1 className="font-bold text-lg p-4">Advanced Filtering Options</h1>
            <Separator />
            <div className="flex flex-col gap-3 p-4">
              <div className="w-full flex flex-col gap-3">
                <h2 className="font-bold text-lg">Cuisine</h2>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="font-normal cursor-pointer flex-1 justify-between"
                    >
                      {currentCuisine?.id && currentCuisine?.adjective ? currentCuisine.adjective : "Select a cuisine..."}
                      <ChevronDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[clamp(250px,25vw,450px)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search cuisine..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>
                          No cuisines found.
                        </CommandEmpty>
                        <CommandGroup>
                          {
                            cuisines.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.adjective}
                                onSelect={(val) => setValue("cuisine", cuisines.find(({ adjective }) => adjective === val)!)}
                              >
                                <div className="flex items-center gap-2">
                                  <Image
                                    src={c.icon} 
                                    alt={`Origin of ${c.adjective} cuisine`}
                                    width={35}
                                    height={35}
                                    className="rounded-full shadow-sm"
                                  />
                                  {c.adjective}
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    c.id === currentCuisine?.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))
                          }
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col lg:flex-row justify-between gap-3 lg:items-center">
                <div className="w-full flex flex-col gap-3">
                  <h2 className="font-bold text-lg">Diet</h2>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="font-normal cursor-pointer flex-1 justify-between"
                      >
                        {currentDiet?.id && currentDiet?.name ? currentDiet.name : "Select a diet..."}
                        <ChevronDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search diet..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>
                            No diets found.
                          </CommandEmpty>
                          <CommandGroup>
                            {
                              diets.map((d) => (
                                <CommandItem
                                  key={d.id}
                                  value={d.name}
                                  onSelect={() => setValue("diet", diets.find(({ id }) => id === d.id)!)}
                                >
                                  {d.name}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      d.id === currentDiet?.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))
                            }
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="w-full flex flex-col gap-3">
                  <h2 className="font-bold text-lg">Dish Type</h2>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="font-normal cursor-pointer flex-1 justify-between"
                      >
                        {currentDishType?.id && currentDishType?.name ? currentDishType.name : "Select a dish type..."}
                        <ChevronDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search dish type..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>
                            No dish types found.
                          </CommandEmpty>
                          <CommandGroup>
                            {
                              dishTypes.map((d) => (
                                <CommandItem
                                  key={d.id}
                                  value={d.name}
                                  onSelect={() => setValue("dishType", dishTypes.find(({ id }) => id === d.id)!)}
                                >
                                  {d.name}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      d.id === currentDishType?.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))
                            }
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Button 
                variant="link"
                onClick={() => {
                  reset({ query });
                  setParams(null);
                }}
                className="size-fit cursor-pointer text-red-500 p-0"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </form>
    </Popover>
  );
}
