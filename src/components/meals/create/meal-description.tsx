"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_MEAL_DESCRIPTION_LENGTH } from "@/lib/zod/meal";
import { Info } from "lucide-react";
import { useFormState, useWatch } from "react-hook-form";
import { useCreateMealFormContext } from "@/components/meals/create/create-meal-form";

export default function MealDescription() {
  const { control, register } = useCreateMealFormContext();
  const {
    errors: {
      description: descriptionError
    }
  } = useFormState({ control, name: "description" });
  const currentDescription = useWatch({ control, name: "description" });
  
  return (
    <section className="flex flex-col gap-1.5">
      <h1 className="text-2xl font-bold">Description</h1>
      <p className="text-muted-foreground font-semibold text-sm">
        Add a brief description about your recipe here. (optional)
      </p>
      <Textarea
        {...register("description")}
        spellCheck={false}
        placeholder="Description"
        autoComplete="off"
        className="resize-none min-h-24 hyphens-auto flex-1 flex rounded-sm shadow-none"
      />
      <span className={cn("shrink-0 text-sm", currentDescription && currentDescription.length > MAX_MEAL_DESCRIPTION_LENGTH && "text-red-500")}>
        <b className="text-base">{currentDescription?.length || 0}</b> / {MAX_MEAL_DESCRIPTION_LENGTH}
      </span>
      <div className="error-text text-xs has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{descriptionError?.message}</span>
      </div>
    </section>
  );
}
