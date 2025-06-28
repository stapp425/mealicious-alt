"use client";

import { PlanCreation, PlanCreationSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import PlanCalendar from "@/components/plans/create/plan-calendar";
import PlanTags from "@/components/plans/create/plan-tags";
import PlanTitle from "@/components/plans/create/plan-title";
import PlanDescription from "@/components/plans/create/plan-description";
import { Loader2 } from "lucide-react";
import PlanMealSearch from "./plan-meal-search";
import { useMediaQuery } from "usehooks-ts";
import { useAction } from "next-safe-action/hooks";
import { createPlan } from "@/lib/actions/db";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type CreatePlanFormProps = {
  userId: string;
};

export default function CreatePlanForm({ userId }: CreatePlanFormProps) {
  const { replace } = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const matches = useMediaQuery("(min-width: 80rem)");
  const createPlanForm = useForm<PlanCreation>({
    resolver: zodResolver(PlanCreationSchema),
    defaultValues: {
      title: "",
      date: new Date(),
      tags: [],
      meals: []
    }
  });
  
  const { executeAsync } = useAction(createPlan, {
    onSuccess: ({ data }) => toast.success(data?.message),
    onError: () => toast.error("Failed to create plan.")
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const onSubmit = createPlanForm.handleSubmit(async (data) => {
    await executeAsync({ createdPlan: data });
    createPlanForm.reset();
    replace("/plans");
  });
  
  return (
    <FormProvider {...createPlanForm}>
      <form onSubmit={onSubmit} className="h-full w-full max-w-[1000px] mx-auto p-4 sm:p-6">
        <h1 className="font-bold text-4xl mb-4">Create Plan</h1>
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="w-full xl:max-w-[400px] flex flex-col gap-3">
            {mounted && !matches && <PlanTitle />}
            <PlanCalendar />
            <PlanTags />
            <button
              disabled={createPlanForm.formState.isSubmitting}
              type="submit" 
              className="hidden lg:flex mealicious-button justify-center items-center font-bold px-6 py-2 rounded-md"
            >
              {createPlanForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : "Create Plan"}
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {mounted && matches && <PlanTitle />}
            <PlanDescription />
            <PlanMealSearch userId={userId}/>
            <button
              disabled={createPlanForm.formState.isSubmitting}
              type="submit" 
              className="flex lg:hidden mealicious-button justify-center items-center font-bold px-6 py-2 rounded-md"
            >
              {createPlanForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : "Create Plan"}
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
