"use client";

import { Input } from "@/components/ui/input";
import { RecipeEdition } from "@/lib/zod";
import { Info } from "lucide-react";
import { useFormContext } from "react-hook-form";

export default function RecipeSource() {
  const {
    register,
    formState: {
      errors
    }
  } = useFormContext<RecipeEdition>();
  
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Source</h1>
      <p className="text-muted-foreground font-semibold">
        Add a source name and URL if this recipe comes from an external source. (optional)
      </p>
      {
        errors.source?.name?.message && (
          <div className="error-text">
            <Info size={14}/>
            {errors.source?.name?.message}
          </div>
        )
      }
      <Input 
        {...register("source.name")}
        placeholder="Source Name (optional)"
      />
      {
        errors.source?.url?.message && (
          <div className="error-text">
            <Info size={14}/>
            {errors.source?.url?.message}
          </div>
        )
      }
      <Input 
        {...register("source.url")}
        placeholder="Source URL (optional)"
      />
      {
        errors.source?.message && (
          <div className="error-text">
            <Info size={14}/>
            {errors.source?.message}
          </div>
        )
      }
    </div>
  );
}
