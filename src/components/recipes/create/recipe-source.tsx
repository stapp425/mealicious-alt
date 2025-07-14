"use client";

import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";
import { useCreateRecipeFormContext } from "@/components/recipes/create/create-recipe-form";
import { useFormState } from "react-hook-form";

export default function RecipeSource() {
  const { control, register } = useCreateRecipeFormContext();
  const { 
    errors: {
      source: sourceError
    }
  } = useFormState({ control, name: ["source.name", "source.url"] });
  
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Source</h1>
      <p className="text-muted-foreground font-semibold">
        Add a source name and URL if this recipe comes from an external source. (optional)
      </p>
      {
        sourceError?.name?.message && (
          <div className="error-text">
            <Info size={14}/>
            {sourceError.name.message}
          </div>
        )
      }
      <Input 
        {...register("source.name")}
        placeholder="Source Name (optional)"
      />
      {
        sourceError?.url?.message && (
          <div className="error-text">
            <Info size={14}/>
            {sourceError.url.message}
          </div>
        )
      }
      <Input 
        {...register("source.url")}
        placeholder="Source URL (optional)"
      />
      {
        sourceError?.message && (
          <div className="error-text">
            <Info size={14}/>
            {sourceError.message}
          </div>
        )
      }
    </div>
  );
}
