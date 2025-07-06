"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { unitAbbreviations } from "@/lib/types";
import { MAX_SERVING_SIZE_AMOUNT, RecipeEdition } from "@/lib/zod";
import { Info, Plus } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

const MAX_NUTRITION_DISPLAY_LIMIT = 4;

export default function RecipeNutrition() {
  const {
    control,
    register,
    formState: {
      errors
    }
  } = useFormContext<RecipeEdition>();
  const nutrition = useWatch({ control, name: "nutrition" });
  
  return (
    <div className="flex flex-col justify-between gap-3">
      <h1 className="font-bold text-2xl required-field">Nutrition</h1>
      {
        errors.servingSize?.amount?.message && (
          <div className="error-text">
            <Info size={14}/>
            {errors.servingSize?.amount?.message}
          </div>
        )
      }
      {
        errors.servingSize?.unit?.message && (
          <div className="error-text">
            <Info size={14}/>
            {errors.servingSize?.unit?.message}
          </div>
        )
      }
      <div className="flex justify-end items-center gap-3">
        <h1 className="font-semibold my-2 mr-auto">Serving Size:</h1>
        <Input
          type="number"
          min={0}
          max={MAX_SERVING_SIZE_AMOUNT}
          step="any"
          className="w-[100px]"
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
          nutrition.slice(0, MAX_NUTRITION_DISPLAY_LIMIT).map((rn, i) => (
            <div key={rn.id} className="flex flex-col gap-3">
              {
                errors?.nutrition?.[i]?.amount?.message && (
                  <div className="flex items-center gap-3 text-xs text-red-500">
                    <Info size={14}/>
                    {errors?.nutrition?.[i]?.amount?.message}
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
                  className="w-[100px]"
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
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full cursor-pointer flex justify-between items-center">
              More Nutrition
              <Plus />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent asChild>
            <div className="flex flex-col gap-3 mt-3">
              {
                nutrition.slice(MAX_NUTRITION_DISPLAY_LIMIT).map((rn, i) => (
                  <div key={rn.id} className="flex flex-col gap-3">
                    {
                      errors?.nutrition?.[i]?.amount?.message && (
                        <div className="flex items-center gap-3 text-xs text-red-500">
                          <Info size={14}/>
                          {errors?.nutrition?.[i]?.amount?.message}
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
                        className="w-[100px]"
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
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
