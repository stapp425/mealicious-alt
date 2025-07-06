"use client";

import { MealCreation, MealCreationSchema } from "@/lib/zod";
import { FormProvider, useForm } from "react-hook-form";
import MealRecipeSearch from "@/components/meals/create/meal-recipes";
import { zodResolver } from "@hookform/resolvers/zod";
import MealTags from "@/components/meals/create/meal-tags";
import MealDescription from "@/components/meals/create/meal-description";
import MealTitle from "@/components/meals/create/meal-title";
import { useAction } from "next-safe-action/hooks";
import { createMeal } from "@/lib/actions/meal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type CreateMealFormProps = {
  userId: string;
};

export default function CreateMealForm({ userId }: CreateMealFormProps) {
  const { replace } = useRouter();
  const { executeAsync } = useAction(createMeal, {
    onSuccess: ({ data }) => {
      toast.success(data?.message);
      replace(`/meals`);
    },
    onError: () => toast.error("Failed to create meal.")
  });
  
  const createMealForm = useForm<MealCreation>({
    resolver: zodResolver(MealCreationSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      recipes: []
    }
  });

  const onSubmit = createMealForm.handleSubmit(async (data) => {
    await executeAsync({ createdMeal: data });
  });

  return (
    <FormProvider {...createMealForm}>
      <form onSubmit={onSubmit} className="max-w-[750px] w-full min-h-screen flex flex-col gap-3 mx-auto p-4">
        <h1 className="font-bold text-4xl mb-4">Create a Meal</h1>
        <MealTitle />
        <MealDescription />
        <MealTags />
        <MealRecipeSearch userId={userId}/>
        <button
          disabled={createMealForm.formState.isSubmitting}
          type="submit" 
          className="flex mealicious-button justify-center items-center font-bold px-6 py-3 rounded-md"
        >
          {createMealForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : "Create Meal"}
        </button>
      </form>
    </FormProvider>
  );
}
