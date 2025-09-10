"use client";

import { type CreateMealForm, CreateMealFormSchema } from "@/lib/zod/meal";
import { Control, useForm, UseFormRegister, UseFormSetValue } from "react-hook-form";
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
import { createContext, useContext, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

type CreateMealFormProps = {
  userId: string;
};

type CreateMealFormContextProps<T extends CreateMealForm = CreateMealForm> = {
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
};

const CreateMealFormContext = createContext<CreateMealFormContextProps | null>(null);

export function useCreateMealFormContext() {
  const context = useContext(CreateMealFormContext);
  if (!context) throw new Error("useCreateMealForm can only be used within a CreateMealFormContext.");
  return context;
}

export default function CreateMealForm({ userId }: CreateMealFormProps) {
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
    resolver: zodResolver(CreateMealFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      recipes: []
    }
  });

  const { execute, isExecuting } = useAction(createMeal, {
    onSuccess: async ({ data }) => {
      await queryClient.invalidateQueries({
        queryKey: ["plan-form-meal-results"]
      });
      reset();
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
    <CreateMealFormContext value={providerProps}>
      <form onSubmit={handleSubmit(execute)} className="max-w-216 w-full min-h-screen flex flex-col gap-3 mx-auto p-4">
        <h1 className="font-bold text-4xl">Create a Meal</h1>
        <MealTitle />
        <MealDescription />
        <MealTags />
        <MealRecipeSearch userId={userId}/>
        <button
          disabled={isExecuting}
          type="submit" 
          className="mealicious-button flex justify-center items-center font-bold px-6 py-2 rounded-md"
        >
          {isExecuting ? <Loader2 className="animate-spin"/> : "Create Meal"}
        </button>
      </form>
    </CreateMealFormContext>
  );
}
