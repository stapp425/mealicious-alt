"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { unitAbbreviations } from "@/lib/types";
import { MAX_SERVING_SIZE_AMOUNT } from "@/lib/zod";
import { Info, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useFieldArray, useFormState } from "react-hook-form";
import { useCreateRecipeFormContext } from "@/components/recipes/create/create-recipe-form";

const MAX_NUTRITION_DISPLAY_LIMIT = 4;

export default function RecipeNutrition() {
  const { control, register } = useCreateRecipeFormContext();
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
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col justify-between gap-3">
      <h1 className="font-bold text-2xl required-field">Nutrition</h1>
      {
        servingSizeError?.amount?.message && (
          <div className="error-text">
            <Info size={14}/>
            {servingSizeError.amount.message}
          </div>
        )
      }
      {
        servingSizeError?.unit?.message && (
          <div className="error-text">
            <Info size={14}/>
            {servingSizeError.unit.message}
          </div>
        )
      }
      <div className="flex justify-end items-center gap-3">
        <h1 className="font-semibold mr-auto">Serving Size:</h1>
        <Input
          type="number"
          min={0}
          max={MAX_SERVING_SIZE_AMOUNT}
          step="any"
          className="w-18 sm:w-24"
          {...register("servingSize.amount")} 
        />
        <Select defaultValue="g" {...register("servingSize.unit")}>
          <SelectTrigger className="w-[100px]">
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
        {
          macronutrients.map((rn, i) => (
            <div key={rn.id} className="flex flex-col gap-3">
              {
                nutritionError?.[i]?.amount?.message && (
                  <div className="flex items-center gap-3 text-xs text-red-500">
                    <Info size={14}/>
                    {nutritionError[i].amount.message}
                  </div>
                )
              }
              <div className="flex justify-between items-center gap-3">
                <Input
                  defaultValue={rn.name}
                  disabled
                  className="flex-1 disabled:text-primary"
                />
                <Input
                  type="number"
                  min={0}
                  max={9999.99}
                  step="any"
                  {...register(`nutrition.${i}.amount`)}
                  className="w-18 sm:w-24"
                />
                <Select 
                  disabled={rn.allowedUnits.length <= 1}
                  {...register(`nutrition.${i}.unit`)}
                >
                  <SelectTrigger className="w-[100px]">
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
            </div>
          ))
        }
        <CollapsibleContent className="flex flex-col gap-3">
          {
            micronutrients.map((rn, i) => (
              <div key={rn.id} className="flex flex-col gap-3">
                {
                  nutritionError?.[i]?.amount?.message && (
                    <div className="flex items-center gap-3 text-xs text-red-500">
                      <Info size={14}/>
                      {nutritionError[i].amount.message}
                    </div>
                  )
                }
                <div className="flex justify-between items-center gap-3">
                  <Input
                    defaultValue={rn.name}
                    disabled
                    className="flex-1 disabled:text-primary"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={9999.99}
                    step="any"
                    {...register(`nutrition.${i + MAX_NUTRITION_DISPLAY_LIMIT}.amount`)}
                    className="w-18 sm:w-24"
                  />
                  <Select 
                    disabled={rn.allowedUnits.length <= 1}
                    {...register(`nutrition.${i}.unit`)}
                  >
                    <SelectTrigger className="w-[100px]">
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
              </div>
            ))
          }
        </CollapsibleContent>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full cursor-pointer flex justify-between items-center">
            {open ? "Less Nutrition" : "More Nutrition"}
            {open ? <Minus /> : <Plus />}
          </Button>
        </CollapsibleTrigger>
      </div>
    </Collapsible>
  );
}
