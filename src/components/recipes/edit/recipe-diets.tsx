"use client";

import { diet } from "@/db/schema";
import { cn } from "@/lib/utils";
import { MAX_RECIPE_DIETS_LENGTH } from "@/lib/zod/recipe";
import { InferSelectModel } from "drizzle-orm";
import { ComponentProps, useMemo, useState } from "react";
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
import { Check, ChevronDown, Info } from "lucide-react";
import { useEditRecipeFormContext } from "@/components/recipes/edit/edit-recipe-form";

type Diet = Omit<InferSelectModel<typeof diet>, "description">;

type RecipeDietsProps = {
  readonly diets: Diet[]; // diets from database
};

export default function RecipeDiets({
  diets,
  className,
  ...props
}: RecipeDietsProps & Omit<ComponentProps<"section">, "children">) {
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
    <section 
      {...props}
      className={cn(
        "flex flex-col gap-2",
        className
      )}
    >
      <h1 className="font-bold text-2xl">Diets</h1>
      <div className="error-text text-sm has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{dietsError?.message}</span>
      </div>
      <div className="relative flex justify-between gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="cursor-pointer flex-1 font-normal justify-between rounded-sm shadow-none"
            >
              {diet.name || "Select a diet"}
              <ChevronDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-50 p-0" align="end">
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
          className="mealicious-button text-sm right-1.5 font-semibold px-6 rounded-sm"
        >
          Add
        </button>
      </div>
      <div className="has-[>ul:empty]:hidden flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-sm">
          <Info size={16}/>
          You can remove a diet by clicking on one.
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {
            formDietValues.map((d, index) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="cursor-pointer mealicious-button text-white text-xs font-semibold min-w-12 hover:bg-red-500 hover:text-white px-3 py-1 rounded-full transition-colors"
                >
                  {d.name}
                </button>
              </li>
            ))
          }
        </ul>
      </div>
      <div className="flex flex-col items-start">
        <p className="font-semibold text-sm text-muted-foreground">
          Add some diets to your recipe here. (optional)
        </p>
        <span className={cn(
          "shrink-0 text-sm",
          formDietValues.length > MAX_RECIPE_DIETS_LENGTH && "text-red-500"
        )}>
          <b className="text-base">{formDietValues.length}</b> / {MAX_RECIPE_DIETS_LENGTH}
        </span>
      </div>
    </section>
  );
}
