"use client";

import { Unit } from "@/lib/types";
import { diet, dishType, nutrition } from "@/db/schema";
import { type EditRecipeForm, EditRecipeFormSchema } from "@/lib/zod/recipe";
import { zodResolver } from "@hookform/resolvers/zod";
import { InferSelectModel } from "drizzle-orm";
import { LoaderCircle } from "lucide-react";
import { Control, useForm, UseFormRegister, UseFormSetValue } from "react-hook-form";
import RecipeImageUploader from "@/components/recipes/edit/recipe-image-uploader";
import RecipeTags from "@/components/recipes/edit/recipe-tags";
import RecipeTimes from "@/components/recipes/edit/recipe-times";
import RecipeDiets from "@/components/recipes/edit/recipe-diets";
import RecipeDishTypes from "@/components/recipes/edit/recipe-dish-types";
import RecipeIngredients from "@/components/recipes/edit/recipe-ingredients";
import RecipeInstructions from "@/components/recipes/edit/recipe-instructions";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { createContext, useContext, useEffect, useMemo } from "react";
import RecipeTitle from "@/components/recipes/edit/recipe-title";
import RecipeCuisine from "@/components/recipes/edit/recipe-cuisine";
import RecipeSource from "@/components/recipes/edit/recipe-source";
import RecipeDescription from "@/components/recipes/edit/recipe-description";
import RecipeNutrition from "@/components/recipes/edit/recipe-nutrition";
import { updateRecipe, updateRecipeImage } from "@/lib/actions/recipe";
import { generatePresignedUrlForImageDelete, generatePresignedUrlForImageUpload } from "@/lib/actions/r2";
import { useContainerQuery } from "@/hooks/use-container-query";
import { useQueryClient } from "@tanstack/react-query";
import { useHydration } from "@/hooks/use-hydration";
import { remToPx } from "@/lib/utils";

const CONTAINER_4XL_BREAKPOINT = 52;

type EditRecipeFormProps = {
  readonly cuisines: {
    id: string;
    adjective: string;
    icon: string;
  }[];
  readonly diets: Omit<InferSelectModel<typeof diet>, "description">[];
  readonly dishTypes: Omit<InferSelectModel<typeof dishType>, "description">[];
  readonly nutrition: Omit<InferSelectModel<typeof nutrition>, "description">[];
  recipe: {
    id: string;
    description: string | null;
    title: string;
    image: string;
    tags: string[];
    cookTime: number;
    prepTime: number;
    readyTime: number;
    isPublic: boolean;
    createdBy: string | null;
    sourceName: string | null;
    sourceUrl: string | null;
    servingSizeAmount: number;
    servingSizeUnit: Unit["abbreviation"];
    cuisine: {
      id: string;
      adjective: string;
      icon: string;
    } | null;
    diets: {
      diet: {
        name: string;
        id: string;
      };
    }[];
    dishTypes: {
      dishType: {
        name: string;
        id: string;
      };
    }[];
    nutritionalFacts: {
      unit: Unit["abbreviation"];
      amount: number;
      nutrition: {
        name: string;
        id: string;
        allowedUnits: Unit["abbreviation"][];
      };
    }[];
    ingredients: {
      name: string;
      id: string;
      unit: Unit["abbreviation"];
      amount: number;
      note: string | null;
    }[];
    instructions: {
      id: string;
      description: string;
      title: string;
      time: number;
      index: number;
    }[];
  };
};

type RecipeFormContextProps<T extends EditRecipeForm = EditRecipeForm> = {
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
};

const EditRecipeFormContext = createContext<RecipeFormContextProps | null>(null);

export function useEditRecipeFormContext() {
  const context = useContext(EditRecipeFormContext);
  if (!context) throw new Error("useEditRecipeFormContext can only be used within a EditRecipeFormContext.");
  return context;
}

export default function EditRecipeForm({
  cuisines,
  diets,
  dishTypes,
  recipe,
  nutrition
}: EditRecipeFormProps) {  
  const queryClient = useQueryClient();
  const { push } = useRouter();

  const hydrated = useHydration();
  const [ref, matches] = useContainerQuery<HTMLFormElement>({
    condition: ({ width }) => width >= remToPx(CONTAINER_4XL_BREAKPOINT - 2)
  });
  // combine both recipe's nutrients and database nutrients together
  const updatedNutrition = nutrition.map((n) => {
    const matchingRecipeNutrition = recipe.nutritionalFacts.find(({ nutrition }) => nutrition.id === n.id);
    return matchingRecipeNutrition ? {
      id: matchingRecipeNutrition.nutrition.id,
      name: matchingRecipeNutrition.nutrition.name,
      amount: Number(matchingRecipeNutrition.amount),
      unit: matchingRecipeNutrition.unit,
      allowedUnits: matchingRecipeNutrition.nutrition.allowedUnits
    } : { 
      id: n.id,
      name: n.name,
      amount: 0,
      unit: n.allowedUnits[0] || "g",
      allowedUnits: n.allowedUnits
    };
  });
  
  const {
    control,
    register,
    setValue,
    handleSubmit,
    reset,
    formState: {
      isSubmitting,
      isValidating,
      isDirty
    }
  } = useForm({
    resolver: zodResolver(EditRecipeFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    delayError: 250,
    defaultValues: {
      id: recipe.id,
      image: null,
      title: recipe.title,
      isPublic: recipe.isPublic,
      description: recipe.description || undefined,
      source: {
        name: recipe.sourceName || undefined,
        url: recipe.sourceUrl || undefined
      },
      cuisine: recipe.cuisine || undefined,
      cookTime: recipe.cookTime,
      prepTime: recipe.prepTime,
      readyTime: recipe.readyTime,
      diets: recipe.diets.map(({ diet }) => diet),
      dishTypes: recipe.dishTypes.map(({ dishType }) => dishType),
      tags: recipe.tags,
      ingredients: recipe.ingredients.map((i) => ({
        ...i,
        note: i.note || undefined,
        amount: i.amount
      })),
      servingSize: {
        amount: recipe.servingSizeAmount,
        unit: recipe.servingSizeUnit
      },
      nutrition: updatedNutrition,
      instructions: recipe.instructions.map((i) => ({
        ...i,
        time: i.time
      }))
    }
  });

  const onSubmit = useMemo(() => handleSubmit(async (data) => {
    try {
      const { image, ...formDataRest } = data;
      const recipeEditionResult = await updateRecipe(formDataRest);

      if (!recipeEditionResult?.data)
        throw new Error("Failed to update recipe.");

      // user has added a new image
      if (image) {
        const { url: deleteImageUrl } = await generatePresignedUrlForImageDelete(recipe.image);
        await axios.delete(deleteImageUrl);

        const bucketImageName = `recipes/${data.id}/images/main/${image.name}`;
        const { url: insertImageUrl } = await generatePresignedUrlForImageUpload({
          name: bucketImageName,
          size: image.size,
          type: image.type
        });

        await axios.put(insertImageUrl, image, {
          headers: {
            "Content-Type": image.type
          }
        });

        const updateRecipeImageResult = await updateRecipeImage({ 
          recipeId: data.id,
          imageName: bucketImageName
        });

        if (!updateRecipeImageResult?.data)
          throw new Error("Failed to add image to the recipe.");
      }

      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) => 
          typeof queryKey[0] === "string" && 
          ["meal-form-recipes", "recipe-details", "plan-calendar", "daily-plan", "more-plans", "quick-recipe-search-results", "search-recipes-results"].includes(queryKey[0])
      });

      reset(data);
      toast.success("Recipe successfully edited!");
      push(`/recipes/${data.id}`);
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error("Failed to upload the recipe image.");
        return;
      } else if (err instanceof Error) {
        toast.error(err.message);
        return;
      }
    }
  }), [handleSubmit, recipe.image, queryClient, reset, push]);

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
    <EditRecipeFormContext value={providerProps}>
      <form 
        ref={ref}
        onSubmit={onSubmit} 
        className="max-w-188 @min-4xl/main:max-w-324 w-full bg-background mx-auto p-4"
      >
        <h1 className="text-4xl font-bold mb-6">Edit Recipe</h1>
        <div className="flex flex-col @min-4xl:flex-row gap-6">
          <div className="w-full @min-4xl:w-9/20 flex flex-col gap-6">
            <RecipeImageUploader recipeImageURL={recipe.image}/>
            {hydrated && !matches && <RecipeTitle />}
            {hydrated && !matches && <RecipeDescription />}
            <RecipeCuisine cuisines={cuisines}/>
            <RecipeDiets diets={diets}/>
            <RecipeDishTypes dishTypes={dishTypes}/>
            <RecipeTags />
            <RecipeSource />
            {hydrated && !matches && <RecipeTimes />}
            <button
              disabled={isSubmitting || isValidating || !isDirty}
              type="submit" 
              className="hidden @min-4xl:flex mealicious-button justify-center items-center font-bold px-6 py-2 rounded-md"
            >
              {isSubmitting || isValidating ? <LoaderCircle className="animate-spin"/> : "Edit Recipe"}
            </button>
          </div>
          <div className="w-full @min-4xl:w-11/20 flex flex-col gap-6">
            {hydrated && matches && <RecipeTitle />}
            {hydrated && matches && <RecipeTimes />}
            {hydrated && matches && <RecipeDescription />}
            <RecipeIngredients />
            <RecipeInstructions />
            <RecipeNutrition />
            <button
              disabled={isSubmitting || isValidating || !isDirty}
              type="submit" 
              className="flex @min-4xl:hidden mealicious-button justify-center items-center font-bold px-6 py-2 rounded-md"
            >
              {isSubmitting || isValidating ? <LoaderCircle className="animate-spin"/> : "Edit Recipe"}
            </button>
          </div>
        </div>
      </form>
    </EditRecipeFormContext>
  );
}
