"use client";

import { diet, dishType, nutrition } from "@/db/schema/recipe";
import { type CreateRecipeForm, CreateRecipeFormSchema } from "@/lib/zod/recipe";
import { InferSelectModel } from "drizzle-orm";
import { LoaderCircle } from "lucide-react";
import { Control, useForm, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import RecipeImageUploader from "@/components/recipes/create/recipe-image-uploader";
import RecipeTags from "@/components/recipes/create/recipe-tags";
import RecipeTimes from "@/components/recipes/create/recipe-times";
import RecipeDiets from "@/components/recipes/create/recipe-diets";
import RecipeDishTypes from "@/components/recipes/create/recipe-dish-types";
import RecipeIngredients from "@/components/recipes/create/recipe-ingredients";
import RecipeInstructions from "@/components/recipes/create/recipe-instructions";
import { createRecipe, updateRecipeImage } from "@/lib/actions/recipe";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RecipeTitle from "@/components/recipes/create/recipe-title";
import RecipeCuisine from "@/components/recipes/create/recipe-cuisine";
import RecipeSource from "@/components/recipes/create/recipe-source";
import RecipeDescription from "@/components/recipes/create/recipe-description";
import RecipeNutrition from "@/components/recipes/create/recipe-nutrition";
import { generatePresignedUrlForImageUpload } from "@/lib/actions/r2";
import { useContainerQuery } from "@/hooks/use-container-query";

const CONTAINER_4XL_BREAKPOINT = 896;

type CreateRecipeFormProps = {
  readonly nutrition: Omit<InferSelectModel<typeof nutrition>, "description">[];
  readonly cuisines: {
    id: string;
    adjective: string;
    icon: string;
  }[];
  readonly diets: Omit<InferSelectModel<typeof diet>, "description">[];
  readonly dishTypes: Omit<InferSelectModel<typeof dishType>, "description">[];
};

type RecipeFormContextProps<T extends CreateRecipeForm = CreateRecipeForm> = {
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
};

const CreateRecipeFormContext = createContext<RecipeFormContextProps | null>(null);

export function useCreateRecipeFormContext() {
  const context = useContext(CreateRecipeFormContext);
  if (!context) throw new Error("useCreateRecipeFormContext can only be used within a CreateRecipeFormContext.");
  return context;
}

export default function CreateRecipeForm({
  nutrition,
  cuisines,
  diets,
  dishTypes
}: CreateRecipeFormProps) {  
  const { replace } = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const [ref, matches] = useContainerQuery<HTMLFormElement>({
    condition: ({ width }) => width > CONTAINER_4XL_BREAKPOINT
  });
  const { 
    control,
    register,
    reset,
    setValue,
    handleSubmit,
    formState: {
      isSubmitting,
      isValidating,
      isDirty
    }
  } = useForm({
    resolver: zodResolver(CreateRecipeFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    delayError: 250,
    defaultValues: {
      title: "",
      description: "",
      cookTime: 0,
      prepTime: 0,
      readyTime: 0,
      isPublic: false,
      servingSize: {
        amount: 0,
        unit: "g"
      },
      diets: [],
      dishTypes: [],
      ingredients: [],
      instructions: [],
      nutrition: nutrition.map((n) => ({
        ...n,
        amount: 0,
        unit: n.allowedUnits[0] || "g"
      })),
      tags: []
    }
  });

  const onSubmit = useMemo(() => handleSubmit(async (formData) => {
    try {
      const { image, ...formDataRest } = formData;
      const recipeCreationResult = await createRecipe(formDataRest);

      if (!recipeCreationResult?.data)
        throw new Error("Failed to create recipe.");

      const { data: { recipeId } } = recipeCreationResult;
      const bucketImageName = `recipes/${recipeId}/images/main/${image.name}`;

      const { url } = await generatePresignedUrlForImageUpload({
        name: bucketImageName,
        type: image.type,
        size: image.size
      });
      
      await axios.put(url, image, {
        headers: {
          "Content-Type": image.type
        }
      });

      const updateRecipeImageResult = await updateRecipeImage({
        recipeId,
        imageName: bucketImageName
      });

      if (!updateRecipeImageResult?.data?.success)
        throw new Error("Failed to add image to the recipe.");

      reset();
      toast.success("Recipe successfully created!");
      replace(`/recipes/${recipeCreationResult.data.recipeId}`);
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error("Failed to upload the recipe image.");
      } else if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  }), [handleSubmit, reset, replace]);

  const providerProps = useMemo(
    () => ({ 
      control,
      register,
      setValue
    }),
    [control, register, setValue]
  );
  
  useEffect(() => {
    setMounted(true);
  }, [setMounted]);

  useEffect(() => {
    if (!isDirty) return;
    
    const handleUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [isDirty]);
  
  return (
    <CreateRecipeFormContext value={providerProps}>
      <form 
        ref={ref}
        onSubmit={onSubmit} 
        className="@container/create-recipe max-w-188 @min-4xl/main:max-w-324 w-full bg-background mx-auto p-4"
      >
        <h1 className="text-4xl font-bold mb-6">Create a Recipe</h1>
        <div className="flex flex-col @min-4xl/create-recipe:flex-row gap-6">
          <div className="w-full @min-4xl/create-recipe:w-9/20 flex flex-col gap-6">
            <RecipeImageUploader />
            {mounted && !matches && <RecipeTitle />}
            {mounted && !matches && <RecipeDescription />}
            <RecipeCuisine cuisines={cuisines}/>
            <RecipeDiets diets={diets}/>
            <RecipeDishTypes dishTypes={dishTypes}/>
            <RecipeTags />
            <RecipeSource />
            {mounted && !matches && <RecipeTimes />}
            <button
              disabled={isSubmitting || isValidating}
              type="submit" 
              className="hidden @min-4xl/create-recipe:flex mealicious-button justify-center items-center font-bold px-6 py-2 rounded-md"
            >
              {isSubmitting || isValidating ? <LoaderCircle className="animate-spin"/> : "Create Recipe"}
            </button>
          </div>
          <div className="w-full @min-4xl/create-recipe:w-11/20 flex flex-col gap-6">
            {mounted && matches && <RecipeTitle />}
            {mounted && matches && <RecipeTimes />}
            {mounted && matches && <RecipeDescription />}
            <RecipeIngredients />
            <RecipeInstructions />
            <RecipeNutrition />
            <button
              disabled={isSubmitting || isValidating}
              type="submit" 
              className="flex @min-4xl/create-recipe:hidden mealicious-button justify-center items-center font-bold px-6 py-2 rounded-md"
            >
              {isSubmitting || isValidating ? <LoaderCircle className="animate-spin"/> : "Create Recipe"}
            </button>
          </div>
        </div>
      </form>
    </CreateRecipeFormContext>
  );
}
