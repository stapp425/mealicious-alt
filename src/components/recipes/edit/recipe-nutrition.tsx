"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { unitAbbreviations } from "@/lib/types";
import { MAX_RECIPE_SERVING_SIZE_AMOUNT } from "@/lib/zod/recipe";
import { Info, Minus, Plus } from "lucide-react";
import { useFieldArray, useFormState } from "react-hook-form";
import { useEditRecipeFormContext } from "@/components/recipes/edit/edit-recipe-form";
import { ComponentProps, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const MAX_NUTRITION_DISPLAY_LIMIT = 4;

export default function RecipeNutrition({ className, ...props }: Omit<ComponentProps<"section">, "children">) {
  const { control, register } = useEditRecipeFormContext();
  const [open, setOpen] = useState(false);
  const { fields: nutrition } = useFieldArray({ control, name: "nutrition" });
  const { 
    errors: {
      nutrition: nutritionError,
      servingSize: servingSizeError
    }
  } = useFormState({ control, name: ["servingSize.amount", "servingSize.unit", "nutrition"] });

  const macronutrients = useMemo(
    () => nutrition.slice(0, MAX_NUTRITION_DISPLAY_LIMIT),
    [nutrition]
  );

  const micronutrients = useMemo(
    () => nutrition.slice(MAX_NUTRITION_DISPLAY_LIMIT),
    [nutrition]
  );
  
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      asChild
    >
      <section 
        {...props}
        className={cn(
          "@container flex flex-col gap-2",
          className
        )}
      >
        <h1 className="font-bold text-2xl required-field">Nutrition</h1>
        <div className="error-text has-[>span:empty]:hidden">
          <Info size={14}/>
          <span>{servingSizeError?.amount?.message}</span>
        </div>
        <div className="error-text has-[>span:empty]:hidden">
          <Info size={14}/>
          <span>{servingSizeError?.unit?.message}</span>
        </div>
        <div className="flex justify-end items-center gap-3">
          <h2 className="font-semibold mr-auto text-sm">Serving Size:</h2>
          <Input
            type="number"
            min={0}
            max={MAX_RECIPE_SERVING_SIZE_AMOUNT}
            step="any"
            className="w-18 @min-md:w-24 rounded-sm shadow-none"
            {...register("servingSize.amount", { setValueAs: Number })} 
          />
          <Select defaultValue="g" {...register("servingSize.unit")}>
            <SelectTrigger className="w-24 rounded-sm shadow-none">
              <SelectValue placeholder="unit"/>
            </SelectTrigger>
            <SelectContent className="max-h-46">
              {
                unitAbbreviations.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            {
              macronutrients.map((rn, i) => (
                <li key={rn.id} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-xs text-red-500 has-[>span:empty]:hidden">
                    <Info size={14}/>
                    <span>{nutritionError?.[i]?.amount?.message}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <Input
                      defaultValue={rn.name}
                      disabled
                      className="flex-1 disabled:text-primary rounded-sm shadow-none"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={9999.99}
                      step="any"
                      {...register(`nutrition.${i}.amount`, { setValueAs: Number })}
                      className="w-18 @min-md:w-24 rounded-sm shadow-none"
                    />
                    <Select 
                      disabled={rn.allowedUnits.length <= 1}
                      {...register(`nutrition.${i}.unit`)}
                    >
                      <SelectTrigger className="w-24 rounded-sm shadow-none">
                        <SelectValue placeholder={rn.allowedUnits.length > 0 ? rn.allowedUnits[0] : "unit"}/>
                      </SelectTrigger>
                      <SelectContent>
                        {
                          rn.allowedUnits.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </li>
              ))
            }
          </ul>
          <CollapsibleContent asChild>
            <ul className="flex flex-col gap-3">
              {
                micronutrients.map((rn, i) => (
                  <li key={rn.id} className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-xs text-red-500 has-[>span:empty]:hidden">
                      <Info size={14}/>
                      <span>{nutritionError?.[i]?.amount?.message}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      <Input
                        defaultValue={rn.name}
                        disabled
                        className="flex-1 disabled:text-primary rounded-sm shadow-none"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={9999.99}
                        step="any"
                        {...register(`nutrition.${i + MAX_NUTRITION_DISPLAY_LIMIT}.amount`, { setValueAs: Number } )}
                        className="w-18 @min-md:w-24 rounded-sm shadow-none"
                      />
                      <Select 
                        disabled={rn.allowedUnits.length <= 1}
                        {...register(`nutrition.${i}.unit`)}
                      >
                        <SelectTrigger className="w-24 rounded-sm shadow-none">
                          <SelectValue placeholder={rn.allowedUnits.length > 0 ? rn.allowedUnits[0] : "unit"}/>
                        </SelectTrigger>
                        <SelectContent>
                          {
                            rn.allowedUnits.map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </li>
                ))
              }
            </ul>
          </CollapsibleContent>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full cursor-pointer flex justify-between items-center">
              {open ? "Less Nutrition" : "More Nutrition"}
              {open ? <Minus /> : <Plus />}
            </Button>
          </CollapsibleTrigger>
        </div>
      </section>
    </Collapsible>
  );
}
