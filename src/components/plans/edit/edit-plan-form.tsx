"use client";

import { type EditPlanForm, DetailedPlan, EditPlanFormSchema } from "@/lib/zod/plan";
import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, useContext, useEffect, useMemo } from "react";
import { Control, useForm, UseFormRegister, UseFormSetValue } from "react-hook-form";
import PlanCalendar from "@/components/plans/edit/plan-calendar";
import PlanTags from "@/components/plans/edit/plan-tags";
import PlanTitle from "@/components/plans/edit/plan-title";
import PlanDescription from "@/components/plans/edit/plan-description";
import { Loader2 } from "lucide-react";
import PlanMealSearch from "@/components/plans/edit/plan-meals";
import { useAction } from "next-safe-action/hooks";
import { updatePlan } from "@/lib/actions/plan";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MealType } from "@/lib/types";
import { addDays, addMonths, startOfDay, startOfMonth } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useHydration } from "@/hooks/use-hydration";
import { useContainerQuery } from "@/hooks/use-container-query";
import { remToPx } from "@/lib/utils";

type EditPlanFormProps = {
  userId: string;
  planToEdit: DetailedPlan;
};

type EditPlanFormContextProps<T extends EditPlanForm = EditPlanForm> = {
  now: Date;
  startDate: Date;
  endDate: Date;
  planToEdit: DetailedPlan;
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
};

const CONTAINER_4XL_BREAKPOINT = 52;

const EditPlanFormContext = createContext<EditPlanFormContextProps | null>(null);

export function useEditPlanFormContext() {
  const context = useContext(EditPlanFormContext);
  if (!context) throw new Error("useEditPlanFormContext can only be used within an EditPlanFormContext.");
  return context;
}

export default function EditPlanForm({ userId, planToEdit }: EditPlanFormProps) {
  const { push } = useRouter();
  const queryClient = useQueryClient();
  
  const hydrated = useHydration();
  const [ref, matches] = useContainerQuery<HTMLFormElement>({
    condition: ({ width }) => width >= remToPx(CONTAINER_4XL_BREAKPOINT - 2)
  });
  
  const {
    control,
    register,
    setValue,
    reset,
    handleSubmit,
    formState: {
      isDirty
    }
  } = useForm({
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
  
  const { execute, isExecuting } = useAction(updatePlan, {
    onSuccess: async ({ data, input }) => {
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) => 
          typeof queryKey[0] === "string" && 
          ["plan-form-calendar-plans", "plan-calendar", "daily-plan", "more-plans"].includes(queryKey[0])
      });
      reset(input);
      push("/plans");
      toast.success(data.message);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const providerProps = useMemo(
    () => {
      const now = new Date();
      return {
        now: startOfDay(now),
        startDate: startOfMonth(now),
        endDate: addMonths(now, 1),
        planToEdit,
        control,
        register,
        setValue
      };
    },
    [planToEdit, control, register, setValue]
  );

  useEffect(() => {
    if (!isDirty) return;
    
    const handleUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [isDirty]);
  
  return (
    <EditPlanFormContext value={providerProps}>
      <form 
        ref={ref}
        onSubmit={handleSubmit(execute)}
        className="h-full w-full max-w-250 mx-auto p-4 @min-2xl:p-6"
      >
        <h1 className="font-bold text-4xl mb-4">Edit Plan</h1>
        <div className="flex flex-col @min-4xl:flex-row gap-6">
          <div className="flex-1 shrink-0 flex flex-col gap-3">
            {hydrated && !matches && <PlanTitle />}
            <PlanCalendar userId={userId}/>
            <PlanTags />
            <button
              disabled={!isDirty || isExecuting}
              type="submit" 
              className="hidden @min-4xl:flex mealicious-button justify-center items-center font-bold px-6 py-2 rounded-md"
            >
              {isExecuting ? <Loader2 className="animate-spin"/> : "Edit Plan"}
            </button>
          </div>
          <div className="@min-4xl:w-11/20 flex flex-col gap-3">
            {hydrated && matches && <PlanTitle />}
            <PlanDescription />
            <PlanMealSearch userId={userId}/>
            <button
              disabled={!isDirty || isExecuting}
              type="submit" 
              className="flex @min-4xl:hidden mealicious-button justify-center items-center font-bold px-6 py-2 rounded-md"
            >
              {isExecuting ? <Loader2 className="animate-spin"/> : "Edit Plan"}
            </button>
          </div>
        </div>
      </form>
    </EditPlanFormContext>
  );
}
