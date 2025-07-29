"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MAX_PLAN_TITLE_LENGTH, CreatePlanForm } from "@/lib/zod/plan";
import { Info } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

export default function PlanTitle() {
  const {
    control,
    register,
    formState: {
      errors
    }
  } = useFormContext<CreatePlanForm>();
  const title = useWatch({ control, name: "title" });
  
  return (
    <div className="flex flex-col gap-3">
      <h2 className="required-field font-bold text-2xl">
        Title
      </h2>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <p className="font-semibold text-muted-foreground">
          Add a title to your plan here.
        </p>
        <span className={cn(title.length > MAX_PLAN_TITLE_LENGTH && "text-red-500")}>
          <b className="text-xl">{title.length}</b> / {MAX_PLAN_TITLE_LENGTH}
        </span>
      </div>
      <Input
        className="h-[50px] font-bold"
        {...register("title")}
        placeholder="Title"
      />
      {
        errors?.title?.message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {errors.title.message}
          </div>
        )
      }
    </div>
  );
}
