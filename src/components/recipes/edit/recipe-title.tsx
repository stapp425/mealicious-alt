"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MAX_TITLE_LENGTH, RecipeEdition } from "@/lib/zod";
import { Info } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

export default function RecipeTitle() {
  const {
    control,
    register,
    setValue,
    formState: {
      errors
    }
  } = useFormContext<RecipeEdition>();
  const [currentTitle, isPublic] = useWatch({ control, name: ["title", "isPublic"] });
  
  return (
    <div className="flex flex-col gap-3">
      <h2 className="required-field font-bold text-2xl">
        Title
      </h2>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <p className="font-semibold text-muted-foreground">
          Add a title to your recipe here.
        </p>
        <span className={cn(currentTitle.length > MAX_TITLE_LENGTH && "text-red-500")}>
          <b className="text-xl">{currentTitle.length}</b> / {MAX_TITLE_LENGTH}
        </span>
      </div>
      <Input
        {...register("title")}
        placeholder="Title"
        className="h-[50px] font-bold"
      />
      <div className="flex items-center gap-3">
        <Checkbox
          id="isPublic"
          checked={isPublic}
          onCheckedChange={(val) => setValue("isPublic", val === true)}
        />
        <label
          htmlFor="isPublic"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Make Recipe Public
        </label>
      </div>
      {
        errors.title?.message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {errors.title?.message}
          </div>
        )
      }
    </div>
  );
}
