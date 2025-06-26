"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type MealType, mealTypes } from "@/lib/types";
import { MealCreation } from "@/lib/zod";
import { Info } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

export default function MealType() {
  const {
    control,
    setValue,
    formState: {
      errors
    }
  } = useFormContext<MealCreation>();
  const mealType = useWatch({ control, name: "type" });
  
  return (
    <div className="field-container flex flex-col gap-3">
      <h1 className="required-field text-2xl font-bold">Meal Type</h1>
      <p className="text-muted-foreground font-semibold">
        Add a meal type to your meal here.
      </p>
      <Select value={mealType} onValueChange={(val) => setValue("type", val as MealType)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Meal Type"/>
        </SelectTrigger>
        <SelectContent>
          {
            mealTypes.map((m) => (
              <SelectItem key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </SelectItem>
            ))
          }
        </SelectContent>
      </Select>
      {
        errors.type?.message &&
        <div className="error-text text-sm">
          <Info size={16}/>
          {errors.type?.message}
        </div> 
      }
    </div>
  );
}
