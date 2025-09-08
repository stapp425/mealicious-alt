"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MAX_PLAN_TITLE_LENGTH } from "@/lib/zod/plan";
import { Info } from "lucide-react";
import { useFormState, useWatch } from "react-hook-form";
import { useCreatePlanFormContext } from "@/components/plans/create/create-plan-form";

export default function PlanTitle() {
  const { control, register } = useCreatePlanFormContext();
  const title = useWatch({ control, name: "title" });
  const {
    errors: {
      title: titleError
    }
  } = useFormState({ control, name: "title" });
  
  return (
    <section className="grid gap-1.5">
      <h2 className="required-field font-bold text-2xl">
        Title
      </h2>
      <div className="flex flex-col @min-3xl:flex-row justify-between items-start @min-3xl:items-center">
        <p className="font-semibold text-muted-foreground text-sm">
          Add a title to your plan here.
        </p>
        <span className={cn("shrink-0 text-sm", title.length > MAX_PLAN_TITLE_LENGTH && "text-red-500")}>
          <b className="text-base">{title.length}</b> / {MAX_PLAN_TITLE_LENGTH}
        </span>
      </div>
      <Input
        {...register("title")}
        placeholder="Title"
        className="rounded-sm shadow-none"
      />
      <div className="error-text text-xs has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{titleError?.message}</span>
      </div>
    </section>
  );
}
