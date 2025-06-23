"use client";

import { MealEdition, MealEditionSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import MealTitle from "@/components/meals/edit/meal-title";
import MealDescription from "@/components/meals/edit/meal-description";
import MealTags from "@/components/meals/edit/meal-tags";
import MealType from "@/components/meals/edit/meal-type";
import MealRecipeSearch from "@/components/meals/edit/meal-recipe-search";
import { Loader2 } from "lucide-react";
import { updateMeal } from "@/lib/actions/db";

type EditMealFormProps = {
  userId: string;
  meal: {
    id: string;
    title: string;
    description: string | null;
    type: string;
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
    onError: () => toast.error("Failed to create meal.")
  });
  
  const editMealForm = useForm<MealEdition>({
    resolver: zodResolver(MealEditionSchema),
    defaultValues: {
      id: meal.id,
      title: meal.title,
      description: meal.description || undefined,
      type: meal.type,
      tags: meal.tags,
      recipes: meal.includedRecipes.map(({ recipe }) => recipe)
    }
  });

  const onSubmit = editMealForm.handleSubmit(async (data) => {
    await executeAsync({ editedMeal: data });
  });
  
  return (
    <FormProvider {...editMealForm}>
      <form onSubmit={onSubmit} className="max-w-[750px] w-full min-h-screen flex flex-col gap-3 mx-auto p-4">
        <h1 className="font-bold text-4xl mb-4">Edit Meal</h1>
        <MealTitle />
        <MealDescription />
        <MealTags />
        <MealType />
        <MealRecipeSearch userId={userId}/>
        <button
          disabled={editMealForm.formState.isSubmitting}
          type="submit" 
          className="flex mealicious-button justify-center items-center font-bold px-6 py-3 rounded-md"
        >
          {editMealForm.formState.isSubmitting ? <Loader2 className="animate-spin"/> : "Create Meal"}
        </button>
      </form>
    </FormProvider>
  );
}
