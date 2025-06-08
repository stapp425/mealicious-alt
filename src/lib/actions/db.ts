"use server";

import { authActionClient } from "@/safe-action";
import { RecipeCreationSchema, ReviewCreationSchema } from "@/lib/zod";
import { db } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import z from "zod";
import { 
  ingredient, 
  instruction, 
  recipe, 
  recipeFavorite, 
  recipeReview, 
  recipeStatistics, 
  recipeToDiet, 
  recipeToDishType, 
  recipeToNutrition,
  savedRecipe
} from "@/db/schema";

export const createRecipe = authActionClient
  .schema(z.object({
    createdRecipe: RecipeCreationSchema.omit({ image: true })
  }))
  .action(async ({ 
    ctx: { user },
    parsedInput: { createdRecipe }
  }) => {
    // create recipe
    const [{ recipeId }] = await db.insert(recipe)
      .values({
        title: createdRecipe.title,
        description: createdRecipe.description || undefined,
        tags: createdRecipe.tags,
        sourceName: createdRecipe.source?.name || undefined,
        sourceUrl: createdRecipe.source?.url || undefined,
        cookTime: createdRecipe.cookTime.toFixed(2),
        prepTime: createdRecipe.prepTime.toFixed(2),
        readyTime: createdRecipe.readyTime.toFixed(2),
        servingSizeAmount: createdRecipe.servingSize.amount.toFixed(2),
        servingSizeUnit: createdRecipe.servingSize.unit,
        createdBy: user.id,
        cuisineId: createdRecipe.cuisine?.id || undefined,
        isPublic: createdRecipe.isPublic
      }).returning({
        recipeId: recipe.id
      });
    
    // create recipe statistics
    await db.insert(recipeStatistics)
      .values({ recipeId });

    // automatically make the creator of the user save this recipe
    await db.insert(savedRecipe)
      .values({
        recipeId,
        userId: user.id!
      });
    
    // insert recipe nutrition
    await db.insert(recipeToNutrition)
      .values(createdRecipe.nutrition.map((n) => ({
        recipeId,
        nutritionId: n.id,
        amount: n.amount.toFixed(2),
        unit: n.unit
      })));

    // insert recipe ingredients
    const filteredIngredients = createdRecipe.ingredients.filter((i) => i.amount > 0);

    await db.insert(ingredient)
      .values(filteredIngredients.map((i) => ({
        recipeId,
        name: i.name,
        amount: i.amount.toFixed(2),
        unit: i.unit,
        isAllergen: i.isAllergen,
        note: i.note
      })));
    
    // insert recipe diets
    if (createdRecipe.diets.length > 0) {
      await db.insert(recipeToDiet)
        .values(createdRecipe.diets.map((d) => ({
          recipeId,
          dietId: d.id
        })));
    }
    
    // insert recipe dish types
    if (createdRecipe.dishTypes.length > 0) {
      await db.insert(recipeToDishType)
        .values(createdRecipe.dishTypes.map((dt) => ({
          recipeId,
          dishTypeId: dt.id
        })));
    }

    // insert recipe instructions
    await db.insert(instruction)
      .values(createdRecipe.instructions.map((inst, i) => ({
        recipeId,
        title: inst.title,
        description: inst.description,
        index: i + 1,
        time: inst.time.toFixed(2)
      })));

    return recipeId;
  });

export const updateRecipeImage = authActionClient
  .schema(z.object({
    recipeId: z.string(),
    imageName: z.string()
  }))
  .action(async ({ parsedInput: { recipeId, imageName }}) => {
    await db.update(recipe).set({
      image: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/${imageName}`
    }).where(eq(recipe.id, recipeId));

    return {
      success: true as const,
      message: "Recipe successfully uploaded!"
    };
  });

export const toggleRecipeFavorite = authActionClient
  .schema(z.object({
    recipeId: z.string().nonempty({
      message: "Recipe ID cannot be empty."
    })
  }))
  .action(async ({ ctx: { user }, parsedInput: { recipeId } }) => {
    const foundFavoritedRecipe = await db.query.recipeFavorite.findFirst({
      where: (recipeFavorite, { eq, and }) => and(
        eq(recipeFavorite.userId, user.id!),
        eq(recipeFavorite.recipeId, recipeId)
      ),
      columns: {
        userId: true,
        recipeId: true
      }
    });

    // recipe has not been favorited
    if (!foundFavoritedRecipe) {
      await db.insert(recipeFavorite).values({
        userId: user.id!,
        recipeId
      });

      await db.update(recipeStatistics).set({
        favoriteCount: sql`${recipeStatistics.favoriteCount} + 1`
      }).where(eq(recipeStatistics.recipeId, recipeId));
      
      return {
        isFavorite: true
      };
    }

    // recipe is favorited
    await db.delete(recipeFavorite).where(and(
      eq(recipeFavorite.userId, foundFavoritedRecipe.userId),
      eq(recipeFavorite.recipeId, foundFavoritedRecipe.recipeId)
    ));

    await db.update(recipeStatistics).set({
      favoriteCount: sql`${recipeStatistics.favoriteCount} - 1`
    }).where(eq(recipeStatistics.recipeId, recipeId));

    return {
      isFavorite: false
    };
  });

export const toggleSavedListRecipe = authActionClient
  .schema(z.object({
    recipeId: z.string().nonempty({
      message: "Recipe ID cannot be empty."
    })
  }))
  .action(async ({ ctx: { user }, parsedInput: { recipeId } }) => {
    const foundSavedRecipe = await db.query.savedRecipe.findFirst({
      where: (savedRecipe, { eq, and }) => and(
        eq(savedRecipe.userId, user.id!),
        eq(savedRecipe.recipeId, recipeId)
      ),
      columns: {
        userId: true,
        recipeId: true
      }
    });

    if (!foundSavedRecipe) {
      await db.insert(savedRecipe).values({
        userId: user.id!,
        recipeId
      });

      return {
        isSaved: true
      };
    }
    
    await db.delete(savedRecipe).where(and(
      eq(savedRecipe.userId, foundSavedRecipe.userId),
      eq(savedRecipe.recipeId, foundSavedRecipe.recipeId)
    ));

    return {
      isSaved: false
    };
  });

export const createReview = authActionClient
  .schema(z.object({
    recipeId: z.string().nonempty({
      message: "Recipe ID cannot be empty."
    }),
    review: ReviewCreationSchema
  }))
  .action(async ({ parsedInput: { recipeId, review } }) => {
    const foundRecipe = await db.query.recipe.findFirst({
      where: (recipe, { eq }) => eq(recipe.id, recipeId),
      columns: {
        id: true
      }
    });

    if (!foundRecipe)
      throw new Error("Recipe does not exist.");

    await db.insert(recipeReview).values({
      recipeId,
      rating: review.rating,
      content: review.content || undefined
    });

    let insertedRating: `${"one" | "two" | "three" | "four" | "five"}StarCount` = "oneStarCount";

    switch (review.rating) {
      case 1:
        insertedRating = "oneStarCount";
        break;
      case 2:
        insertedRating = "twoStarCount";
        break;
      case 3:
        insertedRating = "threeStarCount";
        break;
      case 4:
        insertedRating = "fourStarCount";
        break;
      case 5:
        insertedRating = "fiveStarCount";
        break;
    }

    await db.update(recipeStatistics).set({
      [insertedRating]: sql`${recipeStatistics[insertedRating]} + 1`
    }).where(eq(recipeStatistics.recipeId, recipeId));

    return {
      success: true as const,
      message: "Review successfully created!"
    };
  });

export const deleteReview = authActionClient
  .schema(z.object({
    reviewId: z.string().nonempty({
      message: "Review ID cannot be empty."
    })
  }))
  .action(async ({ parsedInput: { reviewId } }) => {
    const [deletedReview] = await db.delete(recipeReview)
      .where(eq(recipeReview.id, reviewId))
      .returning({
        id: recipeReview.id,
        rating: recipeReview.rating,
        recipeId: recipeReview.recipeId
      });

    if (!deletedReview)
      throw new Error("Review does not exist.");

    let deletedRating: `${"one" | "two" | "three" | "four" | "five"}StarCount` = "oneStarCount";
    
    switch (deletedReview.rating) {
      case 1:
        deletedRating = "oneStarCount";
        break;
      case 2:
        deletedRating = "twoStarCount";
        break;
      case 3:
        deletedRating = "threeStarCount";
        break;
      case 4:
        deletedRating = "fourStarCount";
        break;
      case 5:
        deletedRating = "fiveStarCount";
        break;
    }

    await db.update(recipeStatistics).set({
      [deletedRating]: sql`${recipeStatistics[deletedRating]} - 1`
    }).where(eq(recipeStatistics.recipeId, deletedReview.recipeId));

    return {
      success: true as const,
      message: "Review successfully removed!"
    };
  });
