"use client";


import { Check, ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InferSelectModel } from "drizzle-orm";
import { dishType } from "@/db/schema/recipe";
import { useFieldArray, useFormState, useWatch } from "react-hook-form";
import { MAX_RECIPE_DISH_TYPES_LENGTH } from "@/lib/zod/recipe";
import { ComponentProps, useMemo, useState } from "react";
import { useCreateRecipeFormContext } from "@/components/recipes/create/create-recipe-form";

type DishType = Omit<InferSelectModel<typeof dishType>, "description">;

type RecipeDishTypes = {
  readonly dishTypes: DishType[]; // dish types from database
};

export default function RecipeDishTypes({
  dishTypes,
  className,
  ...props
}: RecipeDishTypes & Omit<ComponentProps<"section">, "children">) {
  const { control } = useCreateRecipeFormContext();
  const { append, remove } = useFieldArray({ control, name: "dishTypes" });
  const { 
    errors: {
      dishTypes: dishTypesError
    }
  } = useFormState({ control, name: "dishTypes" });
  const formDishTypeValues = useWatch({ control, name: "dishTypes" });
  const [dishType, setDishType] = useState<DishType>({
    id: "",
    name: ""
  });

  const remainingDishTypes = useMemo(() => {
    const formDietValuesSet = new Set(formDishTypeValues.map((fd) => fd.id));
    return dishTypes.filter(({ id }) => !formDietValuesSet.has(id));
  }, [formDishTypeValues, dishTypes]);
  
  return (
    <section 
      {...props}
      className={cn(
        "flex flex-col gap-2",
        className
      )}
    >
      <h1 className="font-bold text-2xl">Dish Types</h1>
      <div className="error-text text-sm has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{dishTypesError?.message}</span>
      </div>
      <div className="relative flex justify-between gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="cursor-pointer flex-1 font-normal justify-between rounded-sm shadow-none"
            >
              {dishType.name || "Select a dish type"}
              <ChevronDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-50 p-0" align="end">
            <Command>
              <CommandInput placeholder="Search dish type..." className="h-9" />
              <CommandList>
                <CommandEmpty>
                  No dish type found.
                </CommandEmpty>
                <CommandGroup>
                  {
                    remainingDishTypes.map((dt) => (
                      <CommandItem
                        key={dt.id}
                        value={dt.name}
                        onSelect={(val) => setDishType(dishTypes.find((dt) => dt.name === val)!)}
                      >
                        {dt.name}
                        <Check
                          className={cn(
                            "ml-auto",
                            dt === dishType ? "opacity-100" : "opacity-0"
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
        <button
          type="button"
          disabled={
            !dishType.id || 
            !dishType.name || 
            formDishTypeValues.some((fdt) => 
              fdt.id === dishType.id && 
              fdt.name === dishType.name) ||
            formDishTypeValues.length >= MAX_RECIPE_DISH_TYPES_LENGTH
          }
          onClick={() => {
            append(dishType);
            setDishType({
              id: "",
              name: ""
            });
          }}
          className="mealicious-button text-sm right-1.5 font-semibold px-6 rounded-sm"
        >
          Add
        </button>
      </div>
      <div className="has-[>ul:empty]:hidden flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-sm">
          <Info size={16}/>
          You can remove a dish type by clicking on one.
        </div>
        <ul className="flex flex-wrap gap-2">
          {
            formDishTypeValues.map((dt, index) => (
              <li key={dt.id}>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="cursor-pointer mealicious-button text-white text-sm font-semibold hover:bg-red-500 hover:text-white py-2 px-4 rounded-sm odd:last:col-span-2 transition-colors"
                >
                  {dt.name}
                </button>
              </li>
            ))
          }
        </ul>
      </div>
      <div className="flex flex-col items-start">
        <p className="font-semibold text-sm text-muted-foreground">
          Add some dish types to your recipe here. (optional)
        </p>
        <span className={cn(
          "shrink-0 text-sm",
          formDishTypeValues.length > MAX_RECIPE_DISH_TYPES_LENGTH && "text-red-500"
        )}>
          <b className="text-base">{formDishTypeValues.length}</b> / {MAX_RECIPE_DISH_TYPES_LENGTH}
        </span>
      </div>
    </section>
  );
}
