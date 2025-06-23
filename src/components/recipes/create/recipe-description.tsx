"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_DESCRIPTION_LENGTH, RecipeCreation } from "@/lib/zod";
import { Info } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

export default function RecipeDescription() {
  const {
    register,
    control,
    formState: {
      errors
    }
  } = useFormContext<RecipeCreation>();
  const currentDescription = useWatch({ control, name: "description" });
  
  return (
    <div className="field-container flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Description</h1>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
        <p className="text-muted-foreground font-semibold">
          Add a brief description about your recipe here. (optional)
        </p>
        <span className={cn(currentDescription && currentDescription.length > MAX_DESCRIPTION_LENGTH && "text-red-500")}>
          <b className="text-xl">{currentDescription?.length || 0}</b> / {MAX_DESCRIPTION_LENGTH}
        </span>
      </div>
      <Textarea
        {...register("description")}
        spellCheck={false}
        placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Aliquam nulla facilisi cras fermentum odio eu feugiat pretium nibh."
        autoComplete="off"
        className="min-h-[100px] break-all flex-1 flex rounded-md"
      />
      {
        errors.description?.message &&
        <div className="error-text text-sm">
          <Info size={16}/>
          {errors.description?.message}
        </div> 
      }
    </div>
  );
}
