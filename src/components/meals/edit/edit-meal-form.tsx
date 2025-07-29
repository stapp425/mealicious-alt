"use client";

import { type EditMealForm, EditMealFormSchema } from "@/lib/zod/meal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import MealTitle from "@/components/meals/edit/meal-title";
import MealDescription from "@/components/meals/edit/meal-description";
import MealTags from "@/components/meals/edit/meal-tags";
import MealRecipeSearch from "@/components/meals/edit/meal-recipes";
import { Loader2 } from "lucide-react";
import { updateMeal } from "@/lib/actions/meal";

type EditMealFormProps = {
  userId: string;
  meal: {
    id: string;
    title: string;
    description: string | null;
    tags: string[];
    createdBy: string | null;
    includedRecipes: {
      recipe: {
        title: string;
        description: string | null;
        id: string;
        image: string;
      };
    }[];
  };
};

export default function EditMealForm({ userId, meal }: EditMealFormProps) {
  const { replace } = useRouter();
  const { executeAsync } = useAction(updateMeal, {
    onSuccess: ({ data }) => {
      toast.success(data?.message);
      replace(`/meals`);
    },
    onError: () => toast.error("Failed to edit meal.")
  });
  
  const editMealForm = useForm<EditMealForm>({
    resolver: zodResolver(EditMealFormSchema),
    defaultValues: {
      id: meal.id,
      title: meal.title,
      description: meal.description || undefined,
      tags: meal.tags,
      recipes: meal.includedRecipes.map(({ recipe }) => recipe)
    }
  });

  const onSubmit = editMealForm.handleSubmit(async (data) => {
    await executeAsync(data);
  });
  
  return (
    <FormProvider {...editMealForm}>
      <form onSubmit={onSubmit} className="max-w-[750px] w-full min-h-screen flex flex-col gap-3 mx-auto p-4">
        <h1 className="font-bold text-4xl mb-4">Edit Meal</h1>
        <MealTitle />
        <MealDescription />
        <MealTags />
        <MealRecipeSearch userId={userId}/>
        <button
          disabled={editMealForm.formState.isSubmitting}
          type="submit" 
          className="flex mealicious-button justify-center items-center font-bold px-6 py-3 rounded-md"
        >
          {editMealForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : "Edit Meal"}
        </button>
      </form>
    </FormProvider>
  );
}
