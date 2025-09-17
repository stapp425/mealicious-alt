"use client";

import { type EditMealForm, EditMealFormSchema } from "@/lib/zod/meal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { Control, useForm, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";
import MealTitle from "@/components/meals/edit/meal-title";
import MealDescription from "@/components/meals/edit/meal-description";
import MealTags from "@/components/meals/edit/meal-tags";
import MealRecipeSearch from "@/components/meals/edit/meal-recipes";
import { Loader2 } from "lucide-react";
import { updateMeal } from "@/lib/actions/meal";
import { createContext, useContext, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

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

type EditMealFormContextProps<T extends EditMealForm = EditMealForm> = {
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
};

const EditMealFormContext = createContext<EditMealFormContextProps | null>(null);

export function useEditMealFormContext() {
  const context = useContext(EditMealFormContext);
  if (!context) throw new Error("useEditMealForm can only be used within a EditMealFormContext.");
  return context;
}

export default function EditMealForm({ userId, meal }: EditMealFormProps) {
  const queryClient = useQueryClient();
  const { push } = useRouter();
  
  const {
    control,
    register,
    setValue,
    handleSubmit,
    reset,
    formState: {
      isDirty
    }
  } = useForm({
    resolver: zodResolver(EditMealFormSchema),
    defaultValues: {
      id: meal.id,
      title: meal.title,
      description: meal.description || undefined,
      tags: meal.tags,
      recipes: meal.includedRecipes.map(({ recipe }) => recipe)
    }
  });

  const { execute, isExecuting } = useAction(updateMeal, {
    onSuccess: async ({ data, input }) => {
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) => 
          typeof queryKey[0] === "string" && 
          ["plan-form-meal-results", "plan-calendar", "daily-plan", "more-plans"].includes(queryKey[0])
      });
      reset(input);
      push("/meals");
      toast.success(data.message);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const providerProps = useMemo(
    () => ({
      control,
      register,
      setValue
    }),
    [control, register, setValue]
  );

  useEffect(() => {
    if (!isDirty) return;
    
    const handleUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [isDirty]);
  
  return (
    <EditMealFormContext value={providerProps}>
      <form onSubmit={handleSubmit(execute)} className="max-w-216 w-full min-h-screen flex flex-col gap-3 mx-auto p-4">
        <h1 className="font-bold text-4xl">Edit Meal</h1>
        <MealTitle />
        <MealDescription />
        <MealTags />
        <MealRecipeSearch userId={userId}/>
        <button
          disabled={!isDirty || isExecuting}
          type="submit" 
          className="mealicious-button flex justify-center items-center font-bold px-6 py-2 rounded-md"
        >
          {isExecuting ? <Loader2 className="animate-spin"/> : "Edit Meal"}
        </button>
      </form>
    </EditMealFormContext>
  );
}
