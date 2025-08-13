"use client";

import { DetailedPlan, EditPlanFormSchema } from "@/lib/zod/plan";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import PlanCalendar from "@/components/plans/edit/plan-calendar";
import PlanTags from "@/components/plans/edit/plan-tags";
import PlanTitle from "@/components/plans/edit/plan-title";
import PlanDescription from "@/components/plans/edit/plan-description";
import { Loader2 } from "lucide-react";
import PlanMealSearch from "@/components/plans/edit/plan-meals";
import { useMediaQuery } from "usehooks-ts";
import { useAction } from "next-safe-action/hooks";
import { updatePlan } from "@/lib/actions/plan";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEditPlanFormContext } from "@/components/plans/edit/edit-plan-form-provider";
import { MealType } from "@/lib/types";
import { addDays, startOfDay } from "date-fns";

export default function EditPlanForm() {
  const { userId, planToEdit } = useEditPlanFormContext();
  const { replace } = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const matches = useMediaQuery("(min-width: 80rem)");
  const editPlanForm = useForm({
    resolver: zodResolver(EditPlanFormSchema),
    defaultValues: {
      id: planToEdit.id,
      title: planToEdit.title,
      tags: planToEdit.tags,
      date: startOfDay(addDays(planToEdit.date, 1)),
      description: planToEdit.description || undefined,
      meals: planToEdit.meals.reduce((obj, meal) => {
        obj[meal.type] = { ...meal, calories: meal.recipes.reduce((num, r) => r.calories + num, 0) };
        return obj;
      }, {} as Record<MealType, DetailedPlan["meals"][number] & { calories: number }>)
    }
  });
  
  const { executeAsync } = useAction(updatePlan, {
    onSuccess: ({ data }) => {
      if (!data) return;
      editPlanForm.reset();
      replace("/plans");
      toast.success(data.message);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const onSubmit = editPlanForm.handleSubmit(async (data) => {
    await executeAsync(data);
  });
  
  return (
    <FormProvider {...editPlanForm}>
      <form onSubmit={onSubmit} className="h-full w-full max-w-[1000px] mx-auto p-4 sm:p-6">
        <h1 className="font-bold text-4xl mb-4">Edit Plan</h1>
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 shrink-0 flex flex-col gap-3">
            {mounted && !matches && <PlanTitle />}
            <PlanCalendar />
            <PlanTags />
            <button
              disabled={editPlanForm.formState.isSubmitting}
              type="submit" 
              className="hidden xl:flex mealicious-button justify-center items-center font-bold px-6 py-2 rounded-md"
            >
              {editPlanForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : "Edit Plan"}
            </button>
          </div>
          <div className="xl:w-11/20 flex flex-col gap-3">
            {mounted && matches && <PlanTitle />}
            <PlanDescription />
            <PlanMealSearch userId={userId}/>
            <button
              disabled={editPlanForm.formState.isSubmitting}
              type="submit" 
              className="flex xl:hidden mealicious-button justify-center items-center font-bold px-6 py-2 rounded-md"
            >
              {editPlanForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : "Edit Plan"}
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
