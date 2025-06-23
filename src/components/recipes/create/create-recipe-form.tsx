"use client";

import { diet, dishType, nutrition } from "@/db/schema/recipe";
import { RecipeCreation, RecipeCreationSchema } from "@/lib/zod";
import { InferSelectModel } from "drizzle-orm";
import { LoaderCircle } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import RecipeImageUploader from "@/components/recipes/create/recipe-image-uploader";
import RecipeTags from "@/components/recipes/create/recipe-tags";
import RecipeTimes from "@/components/recipes/create/recipe-times";
import RecipeDiets from "@/components/recipes/create/recipe-diets";
import RecipeDishTypes from "@/components/recipes/create/recipe-dish-types";
import RecipeIngredients from "@/components/recipes/create/recipe-ingredients";
import RecipeInstructions from "@/components/recipes/create/recipe-instructions";
import { createRecipe, generatePresignedUrlForImageUpload, updateRecipeImage } from "@/lib/actions/db";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { useRouter } from "next/navigation";
import RecipeTitle from "@/components/recipes/create/recipe-title";
import RecipeCuisine from "@/components/recipes/create/recipe-cuisine";
import RecipeSource from "@/components/recipes/create/recipe-source";
import RecipeDescription from "@/components/recipes/create/recipe-description";
import RecipeNutrition from "@/components/recipes/create/recipe-nutrition";

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

export default function CreateRecipeForm({ nutrition, cuisines, diets, dishTypes }: CreateRecipeFormProps) {  
  const { replace } = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const matches = useMediaQuery("(min-width: 80rem)");
  // put macronutrients first
  const [macro, micro] = nutrition.reduce(([a, b]: [typeof nutrition, typeof nutrition], n) => {
    (n.isMacro ? a : b).push(n);
    return [a, b];
  }, [[], []]);
  const createRecipeForm = useForm<RecipeCreation>({
    resolver: zodResolver(RecipeCreationSchema),
    mode: "onSubmit",
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
      cuisine: {
        id: "",
        adjective: "",
        icon: ""
      },
      diets: [],
      dishTypes: [],
      ingredients: [],
      instructions: [],
      nutrition: [
        macro.map((n) => ({
          ...n,
          unit: n.allowedUnits.length > 0 ? n.allowedUnits[0] : "g",
          amount: 0
        })),
        micro.map((n) => ({
          ...n,
          unit: n.allowedUnits.length > 0 ? n.allowedUnits[0] : "g",
          amount: 0
        })),
      ].flat(),
      tags: []
    }
  });

  const handleUnload = (e: BeforeUnloadEvent) => e.preventDefault();
  
  useEffect(() => {
    setMounted(true);
    addEventListener("beforeunload", handleUnload);
    return () => removeEventListener("beforeunload", handleUnload);
  }, []);

  const onSubmit = createRecipeForm.handleSubmit(async (formData) => {
    try {
      const { image, ...formDataRest } = formData;
      const recipeCreationResult = await createRecipe({ createdRecipe: formDataRest });

      if (!recipeCreationResult?.data)
        throw new Error("Failed to create recipe.");

      const { data: { recipeId } } = recipeCreationResult;
      const imageName = `${recipeId}/${image.name}`

      const { url } = await generatePresignedUrlForImageUpload({
        name: imageName,
        type: image.type,
        size: image.size
      });
      
      await axios.put(url, image, {
        headers: {
          "Content-Type": image.type
        }
      });

      const updateRecipeImageResult = await updateRecipeImage({ recipeId, imageName });

      if (!updateRecipeImageResult?.data?.success)
        throw new Error("Failed to add image to the recipe.");

      createRecipeForm.reset();
      toast.success("Recipe successfully created!");
      replace(`/recipes/${recipeCreationResult.data.recipeId}`);
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error("Failed to upload the recipe image.");
      } else if (err instanceof Error) {
        toast.error(err.message);
        return;
      }
    }
  });
  
  return (
    <FormProvider {...createRecipeForm}>
      <form 
        onSubmit={onSubmit} 
        className="max-w-[750px] xl:max-w-[1250px] w-full bg-background mx-auto p-4"
      >
        <h1 className="text-4xl font-bold mb-6">Create a Recipe</h1>
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="w-full xl:w-[500px] flex flex-col gap-3">
            <RecipeImageUploader />
            {mounted && !matches && <RecipeTitle />}
            <RecipeCuisine cuisines={cuisines}/>
            <RecipeTags />
            <RecipeSource />
            <RecipeTimes />
            <button
              disabled={createRecipeForm.formState.isSubmitting}
              type="submit" 
              className="hidden xl:flex mealicious-button justify-center items-center font-bold px-6 py-3 rounded-md"
            >
              {createRecipeForm.formState.isSubmitting ? <LoaderCircle className="animate-spin"/> : "Create Recipe"}
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {mounted && matches && <RecipeTitle />}
            <RecipeDescription />
            <RecipeDiets diets={diets}/>
            <RecipeDishTypes dishTypes={dishTypes}/>
            <RecipeNutrition />
            <RecipeIngredients />
            <RecipeInstructions />
            <button
              disabled={createRecipeForm.formState.isSubmitting}
              type="submit" 
              className="flex xl:hidden mealicious-button justify-center items-center font-bold px-6 py-3 rounded-md"
            >
              {createRecipeForm.formState.isSubmitting ? <LoaderCircle className="animate-spin"/> : "Create Recipe"}
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}