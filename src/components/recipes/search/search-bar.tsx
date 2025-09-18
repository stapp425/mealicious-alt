"use client";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RecipeSearch, RecipeSearchSchema } from "@/lib/zod/recipe";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronDown, Info, Plus, Search, X } from "lucide-react";
import { parseAsBoolean, parseAsIndex, parseAsString, useQueryStates } from "nuqs";
import { Control, useForm, UseFormSetValue, useWatch } from "react-hook-form";
import Image from "next/image";
import { cn, remToPx } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { memo, useCallback, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useContainerQuery } from "@/hooks/use-container-query";
import { useHydration } from "@/hooks/use-hydration";

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
  hasCuisinePreferences: boolean;
  hasDietPreferences: boolean;
  hasDishTypePreferences: boolean;
};

type Item = {
  id: string;
  label: string;
  icon?: string;
};

const CONTAINER_XL_BREAKPOINT = 36;

export default function SearchBar({
  cuisines,
  diets,
  dishTypes,
  hasCuisinePreferences,
  hasDietPreferences,
  hasDishTypePreferences
}: SearchBarProps) {
  const hydrated = useHydration();
  const [ref, matches] = useContainerQuery<HTMLFormElement>({
    condition: ({ width }) => width >= remToPx(CONTAINER_XL_BREAKPOINT - 2)
  });
  
  const [{ 
    query,
    cuisine,
    diet,
    dishType,
    isUsingCuisinePreferences,
    isUsingDishTypePreferences,
    isUsingDietPreferences
  }, setParams] = useQueryStates({
    query: parseAsString.withDefault(""),
    cuisine: parseAsString,
    diet: parseAsString,
    dishType: parseAsString,
    page: parseAsIndex.withDefault(0),
    isUsingCuisinePreferences: parseAsBoolean.withDefault(false),
    isUsingDishTypePreferences: parseAsBoolean.withDefault(false),
    isUsingDietPreferences: parseAsBoolean.withDefault(false)
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isSubmitting }
  } = useForm({
    resolver: zodResolver(RecipeSearchSchema),
    defaultValues: { 
      query,
      cuisine: !isUsingCuisinePreferences ? cuisines.find((c) => c.adjective === cuisine) : undefined,
      diet: !isUsingDietPreferences ? diets.find((d) => d.name === diet) : undefined,
      dishType: !isUsingDishTypePreferences ? dishTypes.find((dt) => dt.name === dishType) : undefined,
      isUsingCuisinePreferences: false,
      isUsingDietPreferences: false,
      isUsingDishTypePreferences: false
    }
  });

  const onSubmit = handleSubmit((data) => {
    setParams({
      query: data.query || null,
      cuisine: data.cuisine?.adjective || null,
      diet: data.diet?.name || null,
      dishType: data.dishType?.name || null,
      isUsingCuisinePreferences: data.isUsingCuisinePreferences,
      isUsingDietPreferences: data.isUsingDietPreferences,
      isUsingDishTypePreferences: data.isUsingDishTypePreferences
    }, {
      shallow: false,
      throttleMs: 500
    });
  });
  
  const [currentCuisine, cuisinePreferencesStatus] = useWatch({ control, name: ["cuisine", "isUsingCuisinePreferences"] });
  const [currentDiet, dietPreferencesStatus] = useWatch({ control, name: ["diet", "isUsingDietPreferences"] });
  const [currentDishType, dishTypePreferencesStatus] = useWatch({ control, name: ["dishType", "isUsingDishTypePreferences"] });

  const currentCuisineItem = useMemo(
    () => currentCuisine ? {
      id: currentCuisine.id,
      icon: currentCuisine.icon,
      label: currentCuisine.adjective
    } : undefined,
    [currentCuisine]
  );

  const currentDietItem = useMemo(
    () => currentDiet ? {
      id: currentDiet.id,
      label: currentDiet.name
    } : undefined,
    [currentDiet]
  );

  const currentDishTypeItem = useMemo(
    () => currentDishType ? {
      id: currentDishType.id,
      label: currentDishType.name
    } : undefined,
    [currentDishType]
  );

  const mappedCuisines = useMemo(
    () => cuisines.map((c) => ({ 
      id: c.id,
      icon: c.icon,
      label: c.adjective
    })),
    [cuisines]
  );

  const mappedDiets = useMemo(
    () => diets.map((d) => ({ 
      id: d.id,
      label: d.name
    })),
    [diets]
  );

  const mappedDishTypes = useMemo(
    () => dishTypes.map((dt) => ({ 
      id: dt.id,
      label: dt.name
    })),
    [dishTypes]
  );

  const setCuisine = useCallback(
    (item: Item) => setValue(
      "cuisine",
      cuisines.find((c) => c.id === item.id),
      { shouldDirty: true }
    ),
    [setValue, cuisines]
  );

  const setDiet = useCallback(
    (item: Item) => setValue(
      "diet",
      diets.find((d) => d.id === item.id),
      { shouldDirty: true }
    ),
    [setValue, diets]
  );

  const setDishType = useCallback(
    (item: Item) => setValue(
      "dishType",
      dishTypes.find((dt) => dt.id === item.id),
      { shouldDirty: true }
    ),
    [setValue, dishTypes]
  );
  
  return (
    <Popover modal>
      <form
        ref={ref}
        onSubmit={onSubmit}
        className="w-full flex flex-col items-start gap-3 my-1.5"
      >
        <div className="w-full flex justify-between items-stretch gap-3">
          <Input 
            placeholder="Recipe Title"
            {...register("query")}
            className="shadow-none rounded-sm"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="font-semibold text-sm mealicious-button flex items-center gap-3 px-4 rounded-sm"
          >
            <span className="hidden @min-xl:block">Search</span>
            <Search size={14}/>
          </button>
        </div>
        <PopoverTrigger asChild>
          <Button 
            variant="outline"
            className="w-full @min-xl:w-fit cursor-pointer gap-4 px-4! rounded-sm shadow-none"
          >
            Advanced Filters
            <Plus />
          </Button>
        </PopoverTrigger>
        <div className="hidden has-[.flex]:flex flex-wrap items-center gap-x-4 gap-y-3">
          <button
            type="button"
            onClick={() => {
              setParams((p) => ({
                ...p,
                isUsingCuisinePreferences: false
              }), {
                shallow: false,
                throttleMs: 500
              });
            }}
            className={cn(
              isUsingCuisinePreferences
                ? "mealicious-button font-semibold text-sm flex items-center gap-4 cursor-pointer py-1.5 px-4 rounded-sm"
                : "hidden"
            )}
          >
            Using Cuisine Preferences
            <X size={16}/>
          </button>
          <button
            type="button"
            onClick={() => {
              setParams((p) => ({
                ...p,
                cuisine: null,
                page: 0
              }), {
                shallow: false,
                throttleMs: 500
              });
            }}
            className={cn(
              cuisine
                ? "mealicious-button font-semibold text-sm flex items-center gap-4 cursor-pointer py-1.5 px-4 rounded-sm"
                : "hidden"
            )}
          >
            Cuisine: {cuisine}
            <X size={16}/>
          </button>
          <button
            type="button"
            onClick={() => {
              setParams((p) => ({
                ...p,
                isUsingDietPreferences: false
              }), {
                shallow: false,
                throttleMs: 500
              });
            }}
            className={cn(
              isUsingDietPreferences
                ? "mealicious-button font-semibold text-sm flex items-center gap-4 cursor-pointer py-1.5 px-4 rounded-sm"
                : "hidden"
            )}
          >
            Using Diet Preferences
            <X size={16}/>
          </button>
          <button
            type="button"
            onClick={() => {
              setParams((p) => ({
                ...p,
                diet: null,
                page: 0
              }), {
                shallow: false,
                throttleMs: 500
              });
            }}
            className={cn(
              diet
                ? "mealicious-button font-semibold text-sm flex items-center gap-4 cursor-pointer py-1.5 px-4 rounded-sm"
                : "hidden"
            )}
          >
            Diet: {diet}
            <X size={16}/>
          </button>
          <button
            type="button"
            onClick={() => {
              setParams((p) => ({
                ...p,
                isUsingDishTypePreferences: false
              }), {
                shallow: false,
                throttleMs: 500
              });
            }}
            className={cn(
              isUsingDishTypePreferences
                ? "mealicious-button font-semibold text-sm flex items-center gap-4 cursor-pointer py-1.5 px-4 rounded-sm"
                : "hidden"
            )}
          >
            Using Dish Type Preferences
            <X size={16}/>
          </button>
          <button
            type="button"
            onClick={() => {
              setParams((p) => ({
                ...p,
                dishType: null,
                page: 0
              }), {
                shallow: false,
                throttleMs: 500
              });
            }}
            className={cn(
              dishType 
                ? "mealicious-button font-semibold text-sm flex items-center gap-4 cursor-pointer py-1.5 px-4 rounded-sm"
                : "hidden",
            )}
          >
            Dish Type: {dishType}
            <X size={16}/>
          </button>
        </div>
        <PopoverContent 
          align={hydrated && matches ? "start" : "center"}
          sideOffset={remToPx(0.75)}
          className="w-[min(36rem,calc(100vw-3rem))] p-0"
          asChild
        >
          <div className="flex flex-col">
            <h1 className="font-bold text-lg p-4">Advanced Filtering Options</h1>
            <Separator />
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Info size={16}/>
                For refined searches, add personal preferences in settings.
              </div>
              <div className="w-full flex flex-col gap-3">
                <h2 className="font-bold text-lg">Cuisine</h2>
                <SelectCommand
                  items={mappedCuisines}
                  selectedItem={currentCuisineItem}
                  disabled={cuisinePreferencesStatus}
                  placeholder="Select a cuisine..."
                  emptyText="No cuisines found."
                  onSelect={setCuisine}
                />
                {
                  hasCuisinePreferences && (
                    <PreferencesStatus 
                      id="isUsingCuisinePreferences"
                      field="cuisine"
                      control={control}
                      setValue={setValue}
                      label="Use Cuisine Preferences"
                    />
                  )
                }
              </div>
              <div className="w-full flex flex-col gap-3">
                <h2 className="font-bold text-lg">Diet</h2>
                <SelectCommand
                  items={mappedDiets}
                  selectedItem={currentDietItem}
                  disabled={dietPreferencesStatus}
                  placeholder="Select a diet..."
                  emptyText="No diets found."
                  onSelect={setDiet}
                />
                {
                  hasDietPreferences && (
                    <PreferencesStatus 
                      id="isUsingDietPreferences"
                      field="diet"
                      control={control}
                      setValue={setValue}
                      label="Use Diet Preferences"
                    />
                  )
                }
              </div>
              <div className="w-full flex flex-col gap-3">
                <h2 className="font-bold text-lg">Dish Type</h2>
                <SelectCommand
                  items={mappedDishTypes}
                  selectedItem={currentDishTypeItem}
                  disabled={dishTypePreferencesStatus}
                  placeholder="Select a dish type..."
                  emptyText="No dish types found."
                  onSelect={setDishType}
                />
                {
                  hasDishTypePreferences && (
                    <PreferencesStatus 
                      id="isUsingDishTypePreferences"
                      field="dishType"
                      control={control}
                      setValue={setValue}
                      label="Use Dish Type Preferences"
                    />
                  )
                }
              </div>
              <Button 
                variant="link"
                onClick={() => reset({ 
                  query: watch("query"),
                  isUsingCuisinePreferences: false,
                  isUsingDietPreferences: false,
                  isUsingDishTypePreferences: false
                })}
                className={cn(
                  currentCuisine || currentDiet || currentDishType || cuisinePreferencesStatus || dietPreferencesStatus || dishTypePreferencesStatus
                    ? "size-fit cursor-pointer text-red-500 p-0"
                    : "hidden"
                )}
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

type SelectCommandProps = {
  items: Item[];
  selectedItem?: Item;
  disabled?: boolean;
  placeholder?: string;
  emptyText?: string;
  onSelect: (item: Item) => void;
};

const SelectCommand = memo(({ 
  items,
  selectedItem,
  disabled = false,
  placeholder = "Select an item...",
  emptyText = "No items found.",
  onSelect,
}: SelectCommandProps) => {
  const handleSelect = useCallback(
    (value: string) => onSelect(items.find((i) => i.label === value)!),
    [onSelect, items]
  );
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="font-normal cursor-pointer flex-1 justify-between shadow-none rounded-sm"
        >
          {selectedItem?.label ? selectedItem.label : placeholder}
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(34rem,calc(100vw-5rem))] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} className="h-9"/>
          <CommandList>
            <CommandEmpty>
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {
                items.map((i) => (
                  <CommandItem
                    key={i.id}
                    value={i.label}
                    onSelect={handleSelect}
                  >
                    <div className="flex items-center gap-2">
                      {
                        i.icon && (
                          <Image
                            src={i.icon} 
                            alt={i.label}
                            width={35}
                            height={35}
                            className="rounded-full shadow-sm"
                          />
                        )
                      }
                      {i.label}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto",
                        i.id === selectedItem?.id ? "opacity-100" : "opacity-0"
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
  );
});

SelectCommand.displayName = "SelectCommand";

type PreferencesStatusProps<T extends RecipeSearch = RecipeSearch> = {
  id: "isUsingCuisinePreferences" | "isUsingDietPreferences" | "isUsingDishTypePreferences";
  field: "cuisine" | "diet" | "dishType"
  label: string;
  control: Control<T>;
  setValue: UseFormSetValue<T>;
};

const PreferencesStatus = memo(({ id, field, label, control, setValue }: PreferencesStatusProps) => {
  const preferenceStatus = useWatch({ control, name: id });
  return (
    <div className="flex items-center gap-3">
      <Checkbox
        id={id}
        checked={preferenceStatus}
        onCheckedChange={(val) => {
          if (val) setValue(field, undefined);
          setValue(
            id,
            val === true,
            { shouldDirty: true }
          );
        }}
      />
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
    </div>
  );
});

PreferencesStatus.displayName = "PreferencesStatus";
