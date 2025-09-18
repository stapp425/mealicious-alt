"use client";

import { type CreatePlanForm, CreatePlanFormSchema } from "@/lib/zod/plan";
import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, useContext, useEffect, useMemo } from "react";
import { Control, useForm, UseFormRegister, UseFormSetValue } from "react-hook-form";
import PlanCalendar from "@/components/plans/create/plan-calendar";
import PlanTags from "@/components/plans/create/plan-tags";
import PlanTitle from "@/components/plans/create/plan-title";
import PlanDescription from "@/components/plans/create/plan-description";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { createPlan } from "@/lib/actions/plan";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useHydration } from "@/hooks/use-hydration";
import { addMonths, startOfDay, startOfMonth } from "date-fns";
import PlanMeals from "@/components/plans/create/plan-meals";
import { useContainerQuery } from "@/hooks/use-container-query";
import { useQueryClient } from "@tanstack/react-query";
import { remToPx } from "@/lib/utils";

type CreatePlanFormProps = {
  userId: string;
};

type CreatePlanFormContextProps<T extends CreatePlanForm = CreatePlanForm> = {
  now: Date;
  startDate: Date;
  endDate: Date;
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
};

const CONTAINER_4XL_BREAKPOINT = 56;

const CreatePlanFormContext = createContext<CreatePlanFormContextProps | null>(null);

export function useCreatePlanFormContext() {
  const context = useContext(CreatePlanFormContext);
  if (!context) throw new Error("useCreatePlanFormContext can only be used within a PlanCalendarContext.");
  return context;
}

export default function CreatePlanForm({ userId }: CreatePlanFormProps) {
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
    resolver: zodResolver(CreatePlanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      title: "",
      tags: [],
      meals: {}
    }
  });
  
  const { execute, isExecuting } = useAction(createPlan, {
    onSuccess: async ({ data }) => {
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) => 
          typeof queryKey[0] === "string" && 
          ["plan-form-calendar-plans", "plan-calendar", "more-plans"].includes(queryKey[0])
      });
      reset();
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
        control,
        register,
        setValue
      };
    },
    [control, register, setValue]
  );

  useEffect(() => {
    if (!isDirty) return;
    
    const handleUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [isDirty]);
  
  return (
    <CreatePlanFormContext value={providerProps}>
      <form
        ref={ref}
        onSubmit={handleSubmit(execute)}
        className="h-full w-full max-w-250 mx-auto p-4 @min-2xl:p-6"
      >
        <h1 className="font-bold text-4xl mb-4">Create Plan</h1>
        <div className="flex flex-col @min-4xl:flex-row gap-6">
          <div className="flex-1 shrink-0 flex flex-col gap-3">
            {hydrated && !matches && <PlanTitle />}
            <PlanCalendar userId={userId}/>
            <PlanTags />
            <button
              disabled={isExecuting}
              type="submit" 
              className="hidden @min-4xl:flex mealicious-button justify-center items-center font-bold px-6 py-2 rounded-md"
            >
              {isExecuting ? <Loader2 className="animate-spin"/> : "Create Plan"}
            </button>
          </div>
          <div className="@min-4xl:w-11/20 flex flex-col gap-3">
            {hydrated && matches && <PlanTitle />}
            <PlanDescription />
            <PlanMeals userId={userId}/>
            <button
              disabled={isExecuting}
              type="submit" 
              className="flex @min-4xl:hidden mealicious-button justify-center items-center font-bold px-6 py-2 rounded-md"
            >
              {isExecuting ? <Loader2 className="animate-spin"/> : "Create Plan"}
            </button>
          </div>
        </div>
      </form>
    </CreatePlanFormContext>
  );
}
