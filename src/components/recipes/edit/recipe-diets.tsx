"use client";

import { diet } from "@/db/schema";
import { cn } from "@/lib/utils";
import { MAX_RECIPE_DIETS_LENGTH } from "@/lib/zod/recipe";
import { InferSelectModel } from "drizzle-orm";
import { useMemo, useState } from "react";
import { useFieldArray, useFormState, useWatch } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, ChevronDown, Info } from "lucide-react";
import { useEditRecipeFormContext } from "@/components/recipes/edit/edit-recipe-form";

type Diet = Omit<InferSelectModel<typeof diet>, "description">;

type RecipeDietsProps = {
  readonly diets: Diet[]; // diets from database
};

export default function RecipeDiets({ diets }: RecipeDietsProps) {
  const { control } = useEditRecipeFormContext();
  const { append, remove } = useFieldArray({ control, name: "diets" });
  const formDietValues = useWatch({ control, name: "diets" });
  const { 
    errors: {
      diets: dietsError
    }
  } = useFormState({ control, name: "diets" });
  const [diet, setDiet] = useState<Diet>({
    id: "",
    name: ""
  });

  const remainingDiets = useMemo(() => {
    const formDietValuesSet = new Set(formDietValues.map((fd) => fd.id));
    return diets.filter(({ id }) => !formDietValuesSet.has(id));
  }, [formDietValues, diets]);
  
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-bold text-2xl">Diets</h1>
      <div className="flex-1 flex flex-col gap-3">
        <div className="relative flex justify-between gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="cursor-pointer flex-1 justify-between"
              >
                {diet.id && diet.name ? diet.name : "Select a diet..."}
                <ChevronDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Search diet..." className="h-9" />
                <CommandList>
                  <CommandEmpty>
                    No diet found.
                  </CommandEmpty>
                  <CommandGroup>
                    {
                      remainingDiets.map((d) => (
                        <CommandItem
                          key={d.id}
                          value={d.name}
                          onSelect={(val) => setDiet(diets.find((d) => d.name === val)!)}
                        >
                          {d.name}
                          <Check
                            className={cn(
                              "ml-auto",
                              d === diet ? "opacity-100" : "opacity-0"
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
            disabled={!diet.id || !diet.name || formDietValues.length >= MAX_RECIPE_DIETS_LENGTH}
            onClick={() => {
              append(diet);
              setDiet({
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
          formDietValues.length > 0 && (
            <>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Info size={16}/>
              You can remove a diet by clicking on it.
            </div>
            <div className="flex flex-wrap gap-1.5">
              {
                formDietValues.map((d, index) => (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => remove(index)}
                    className="cursor-pointer mealicious-button text-white text-xs font-semibold min-w-[50px] hover:bg-red-500 hover:text-white px-3 py-1 rounded-full transition-colors"
                  >
                    {d.name}
                  </button>
                ))
              }
            </div>
            </>
          )
        }
      </div>
      <div className="flex flex-col items-start">
        <p className="font-semibold text-muted-foreground">
          Add some diets to your recipe here. (optional)
        </p>
        <span className={cn(formDietValues.length > MAX_RECIPE_DIETS_LENGTH && "text-red-500")}>
          <b className="text-xl">{formDietValues.length}</b> / {MAX_RECIPE_DIETS_LENGTH}
        </span>
      </div>
      {
        dietsError?.message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {dietsError.message}
          </div>
        )
      }
    </div>
  );
}
