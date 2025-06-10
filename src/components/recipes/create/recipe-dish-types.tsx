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
import { UseFormSetValue } from "react-hook-form";
import { MAX_DISH_TYPES_LENGTH, RecipeCreation } from "@/lib/zod";
import { useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";

type DishType = Omit<InferSelectModel<typeof dishType>, "description">;

type RecipeDishTypes = {
  className?: string;
  readonly dishTypes: DishType[]; // dish types from database
  formDishTypeValues: DishType[]; // dish types from form
  setDishTypes: UseFormSetValue<RecipeCreation>;
  message?: string;
};

export default function RecipeDishTypes({ className, dishTypes, formDishTypeValues, setDishTypes, message }: RecipeDishTypes) {
  const [dishType, setDishType] = useState<DishType>({
    id: "",
    name: ""
  });

  const remainingDishTypes = useMemo(() => {
    const formDishTypeValuesSet = new Set(formDishTypeValues.map((fdt) => fdt.id));
    return dishTypes.filter(({ id }) => !formDishTypeValuesSet.has(id));
  }, [formDishTypeValues, dishTypes]);
  
  return (
    <div className={cn("field-container flex flex-col gap-3", className)}>
      <h1 className="font-bold text-2xl">Dish Types</h1>
      <div className="flex-1 flex flex-col gap-3">
        <div className="relative flex justify-between gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="cursor-pointer flex-1 justify-between"
              >
                {dishType.id && dishType.name ? dishType.name : "Select a dish type..."}
                <ChevronDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="end">
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
                          onSelect={(val) => {
                            setDishType(dishTypes.find((dt) => dt.name === val)!);
                          }}
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
              formDishTypeValues.length >= MAX_DISH_TYPES_LENGTH
            }
            onClick={() => {
              setDishTypes("dishTypes", [...formDishTypeValues,  dishType]);
              setDishType({
                id: "",
                name: ""
              });
            }}
            className="mealicious-button right-1.5 font-semibold px-6 rounded-md"
          >
            Add
          </button>
        </div>
        {
          formDishTypeValues.length > 0 && (
            <>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Info size={16}/>
              You can remove a dish type by clicking on it.
            </div>
            <div className="flex flex-wrap gap-x-1 gap-y-2">
              {
                formDishTypeValues.map((dt) => (
                  <button
                    type="button"
                    key={dt.id}
                    onClick={() => setDishTypes("dishTypes", [...formDishTypeValues.filter((fdt) => fdt.id !== dt.id)])}
                    className="cursor-pointer bg-orange-500 text-white font-semibold hover:bg-red-500 hover:text-white py-2 px-6 rounded-md odd:last:col-span-2 transition-colors"
                  >
                    {dt.name}
                  </button>
                ))
              }
            </div>
            </>
          )
        }
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
        <p className="font-semibold text-muted-foreground">
          Add some dish types to your recipe here. (optional)
        </p>
        <span className={cn(formDishTypeValues.length > MAX_DISH_TYPES_LENGTH && "text-red-500")}>
          <b className="text-xl">{formDishTypeValues.length}</b> / {MAX_DISH_TYPES_LENGTH}
        </span>
      </div>
      {
        message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {message}
          </div>
        )
      }
    </div>
  );
}