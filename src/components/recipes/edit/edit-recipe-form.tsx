"use client";

import { Unit } from "@/lib/types";
import { diet, dishType } from "@/db/schema";
import { RecipeEdition, RecipeEditionSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { InferSelectModel } from "drizzle-orm";
import { LoaderCircle } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import RecipeImageUploader from "@/components/recipes/edit/recipe-image-uploader";
import RecipeTags from "@/components/recipes/edit/recipe-tags";
import RecipeTimes from "@/components/recipes/edit/recipe-times";
import RecipeDiets from "@/components/recipes/edit/recipe-diets";
import RecipeDishTypes from "@/components/recipes/edit/recipe-dish-types";
import RecipeIngredients from "@/components/recipes/edit/recipe-ingredients";
import RecipeInstructions from "@/components/recipes/edit/recipe-instructions";
import { useRouter } from "next/navigation";
import { generatePresignedUrlForImageDelete, generatePresignedUrlForImageUpload, updateRecipe, updateRecipeImage } from "@/lib/actions/db";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import RecipeTitle from "@/components/recipes/edit/recipe-title";
import RecipeCuisine from "@/components/recipes/edit/recipe-cuisine";
import RecipeSource from "@/components/recipes/edit/recipe-source";
import RecipeDescription from "@/components/recipes/edit/recipe-description";
import RecipeNutrition from "@/components/recipes/edit/recipe-nutrition";

type EditRecipeFormProps = {
  readonly cuisines: {
    id: string;
    adjective: string;
    icon: string;
  }[];
  readonly diets: Omit<InferSelectModel<typeof diet>, "description">[];
  readonly dishTypes: Omit<InferSelectModel<typeof dishType>, "description">[];
  recipe: {
    id: string;
    description: string | null;
    title: string;
    image: string;
    tags: string[];
    cookTime: string;
    prepTime: string;
    readyTime: string;
    isPublic: boolean;
    createdBy: string | null;
    sourceName: string | null;
    sourceUrl: string | null;
    servingSizeAmount: string;
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
      id: string;
      unit: Unit["abbreviation"];
      amount: string;
      nutrition: {
        name: string;
        id: string;
        isMacro: boolean;
        allowedUnits: Unit["abbreviation"][];
      };
    }[];
    ingredients: {
      name: string;
      id: string;
      unit: Unit["abbreviation"];
      amount: string;
      isAllergen: boolean;
      note: string | null;
    }[];
    instructions: {
      id: string;
      description: string;
      title: string;
      time: string;
      index: number;
    }[];
  };
};

type Nutrition = {
  id: string;
  unit: Unit["abbreviation"];
  amount: string;
  nutrition: {
    name: string;
    id: string;
    isMacro: boolean;
    allowedUnits: Unit["abbreviation"][];
  };
};

export default function EditRecipeForm({ cuisines, diets, dishTypes, recipe }: EditRecipeFormProps) {  
  const { replace } = useRouter();
  const [mounted, setMounted] = useState<boolean>(false);
  const matches = useMediaQuery("(min-width: 80rem)");
  // put macronutrients first
  const [macro, micro] = recipe.nutritionalFacts.reduce(([a, b]: [Nutrition[], Nutrition[]], n) => {
    (n.nutrition?.isMacro ? a : b).push(n);
    return [a, b];
  }, [[], []]);
  
  const editRecipeForm = useForm<RecipeEdition>({
    resolver: zodResolver(RecipeEditionSchema),
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
      cookTime: Number(recipe.cookTime),
      prepTime: Number(recipe.prepTime),
      readyTime: Number(recipe.readyTime),
      diets: recipe.diets.map(({ diet }) => diet),
      dishTypes: recipe.dishTypes.map(({ dishType }) => dishType),
      tags: recipe.tags,
      ingredients: recipe.ingredients.map((i) => ({
        ...i,
        note: i.note || undefined,
        amount: Number(i.amount)
      })),
      servingSize: {
        amount: Number(recipe.servingSizeAmount),
        unit: recipe.servingSizeUnit
      },
      nutrition: [
        macro.map((n) => ({
          id: n.nutrition.id,
          name: n.nutrition.name,
          amount: Number(n.amount),
          unit: n.unit,
          allowedUnits: n.nutrition.allowedUnits
        })),
        micro.map((n) => ({
          id: n.nutrition.id,
          name: n.nutrition.name,
          amount: Number(n.amount),
          unit: n.unit,
          allowedUnits: n.nutrition.allowedUnits
        })),
      ].flat(),
      instructions: recipe.instructions.map((i) => ({
        ...i,
        time: Number(i.time)
      }))
    }
  });

  const onSubmit = editRecipeForm.handleSubmit(async (data) => {
    try {
      const { image, ...dataRest } = data;
      const recipeEditionResult = await updateRecipe({ editedRecipe: dataRest });

      if (!recipeEditionResult?.data)
        throw new Error("Failed to update recipe.");

      // user has added a new image
      if (image) {
        const { url: deleteImageUrl } = await generatePresignedUrlForImageDelete(recipe.image);
        await axios.delete(deleteImageUrl);

        const imageName = `${data.id}/${image.name}`;
        const { url: insertImageUrl } = await generatePresignedUrlForImageUpload({
          name: imageName,
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
          imageName
        });

        if (!updateRecipeImageResult?.data)
          throw new Error("Failed to add image to the recipe.");
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error("Failed to upload the recipe image.");
      } else if (err instanceof Error) {
        toast.error(err.message);
        return;
      }
    }
    
    toast.success("Recipe successfully edited!");
    editRecipeForm.reset(data);
    replace(`/recipes/${data.id}`);
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <FormProvider {...editRecipeForm}>
      <form 
        onSubmit={onSubmit} 
        className="max-w-[750px] xl:max-w-[1250px] w-full bg-background mx-auto p-4"
      >
        <h1 className="text-4xl font-bold mb-6">Edit Recipe</h1>
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="w-full xl:w-[500px] flex flex-col gap-3">
            <RecipeImageUploader recipeImageUrl={recipe.image}/>
            {mounted && !matches && <RecipeTitle />}
            <RecipeCuisine cuisines={cuisines}/>
            <RecipeTags />
            <RecipeSource />
            <RecipeTimes />
            <button
              disabled={editRecipeForm.formState.isSubmitting}
              type="submit" 
              className="hidden xl:flex mealicious-button justify-center items-center font-bold px-6 py-3 rounded-md"
            >
              {editRecipeForm.formState.isSubmitting ? <LoaderCircle className="animate-spin"/> : "Edit Recipe"}
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
              disabled={editRecipeForm.formState.isSubmitting}
              type="submit" 
              className="flex xl:hidden mealicious-button justify-center items-center font-bold px-6 py-3 rounded-md"
            >
              {editRecipeForm.formState.isSubmitting ? <LoaderCircle className="animate-spin"/> : "Edit Recipe"}
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}