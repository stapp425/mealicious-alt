import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_PLAN_DESCRIPTION_LENGTH } from "@/lib/zod/plan";
import { Info } from "lucide-react";
import { useFormState, useWatch } from "react-hook-form";
import { useCreatePlanFormContext } from "@/components/plans/create/create-plan-form";

export default function PlanDescription() {
  const { control, register } = useCreatePlanFormContext();
  const currentDescription = useWatch({ control, name: "description" });
  const {
    errors: {
      description: descriptionError
    }
  } = useFormState({ control, name: "description" });
  
  return (
    <section className="grid gap-1.5">
      <h1 className="text-2xl font-bold">Description</h1>
      <p className="text-muted-foreground font-semibold text-sm">
        Add a brief description about your recipe here. (optional)
      </p>
      <Textarea
        {...register("description")}
        spellCheck={false}
        placeholder="Description"
        autoComplete="off"
        className="min-h-24 resize-none hyphens-auto flex rounded-sm shadow-none"
      />
      <span className={cn("shrink-0 text-sm", currentDescription && currentDescription.length > MAX_PLAN_DESCRIPTION_LENGTH && "text-red-500", "shrink-0")}>
        <b className="text-base">{currentDescription?.length || 0}</b> / {MAX_PLAN_DESCRIPTION_LENGTH}
      </span>
      <div className="error-text text-xs has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{descriptionError?.message}</span>
      </div> 
    </section>
  );
}
