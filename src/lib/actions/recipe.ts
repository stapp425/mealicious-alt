"use server";

import { ActionError } from "@/lib/types";
import { authActionClient } from "@/safe-action";
import { db } from "@/db";
import { and, asc, count, desc, eq, exists, ilike, isNotNull, notExists, sql } from "drizzle-orm";
import { CreateRecipeFormSchema, EditRecipeFormSchema, CreateReviewFormSchema } from "@/lib/zod/recipe";
import { 
  cuisine as cuisineTable,
  diet as dietTable,
  dishType as dishTypeTable,
  ingredient,
  instruction,
  meal,
  mealToRecipe,
  nutrition,
  plan,
  planToMeal,
  recipe,
  recipeFavorite,
  recipeReview,
  recipeStatistics,
  recipeToDiet,
  recipeToDishType,
  recipeToNutrition,
  reviewLike,
  savedRecipe,
  user,
  userToCuisine,
  userToDiet,
  userToDishType
} from "@/db/schema";
import { deleteRecipeQueryIndex, insertRecipeQueryIndex } from "@/lib/actions/algolia";
import { generatePresignedUrlForImageDelete } from "@/lib/actions/r2";
import { getRatingKey, MAX_GRID_RECIPE_DISPLAY_LIMIT } from "@/lib/utils";
import axios from "axios";
import { removeCacheKeys } from "@/lib/actions/redis";
import z from "zod/v4";
import { IdSchema } from "@/lib/zod";

export const createRecipe = authActionClient
  .inputSchema(CreateRecipeFormSchema.omit({ image: true }))
  .action(async ({ 
    ctx: { user },
    parsedInput: createdRecipe
  }) => {
    const [{ recipeId }] = await db.insert(recipe)
      .values({
        title: createdRecipe.title,
        description: createdRecipe.description || undefined,
        tags: createdRecipe.tags,
        sourceName: createdRecipe.source?.name || undefined,
        sourceUrl: createdRecipe.source?.url || undefined,
        cookTime: createdRecipe.cookTime,
        prepTime: createdRecipe.prepTime,
        readyTime: createdRecipe.readyTime,
        servingSizeAmount: createdRecipe.servingSize.amount,
        servingSizeUnit: createdRecipe.servingSize.unit,
        createdBy: user.id,
        cuisineId: createdRecipe.cuisine?.id || undefined,
        isPublic: createdRecipe.isPublic
      }).returning({
        recipeId: recipe.id
      });
    
    const insertRecipeStatisticsQuery = db.insert(recipeStatistics)
      .values({ 
        recipeId,
        savedCount: 1
      });

    const insertSavedRecipeQuery = db.insert(savedRecipe)
      .values({
        recipeId,
        userId: user.id
      });
    
    const insertNutritionQuery = createdRecipe.nutrition.length > 0 ? db.insert(recipeToNutrition)
      .values(createdRecipe.nutrition.map((n) => ({
        recipeId,
        nutritionId: n.id,
        amount: Number(n.amount.toFixed(2)),
        unit: n.unit
      }))) : undefined;

    const insertIngredientsQuery = createdRecipe.ingredients.length > 0 ? db.insert(ingredient)
      .values(createdRecipe.ingredients.map((i) => ({
        recipeId,
        name: i.name,
        amount: Number(i.amount.toFixed(2)),
        unit: i.unit,
        note: i.note
      }))) : undefined;

    const insertDietsQuery = createdRecipe.diets.length > 0 ? db.insert(recipeToDiet)
      .values(createdRecipe.diets.map((d) => ({
        recipeId,
        dietId: d.id
      }))) : undefined;
    
    const insertDishTypesQuery = createdRecipe.dishTypes.length > 0 ? db.insert(recipeToDishType)
      .values(createdRecipe.dishTypes.map((dt) => ({
        recipeId,
        dishTypeId: dt.id
      }))) : undefined;

    const insertInstructionsQuery = createdRecipe.instructions.length > 0 ? db.insert(instruction)
      .values(createdRecipe.instructions.map((inst, i) => ({
        recipeId,
        title: inst.title,
        description: inst.description,
        index: i + 1,
        time: Number(inst.time.toFixed(2))
      }))) : undefined;

    await Promise.all([
      insertRecipeStatisticsQuery,
      insertSavedRecipeQuery,
      insertNutritionQuery,
      insertIngredientsQuery,
      insertDietsQuery,
      insertDishTypesQuery,
      insertInstructionsQuery
    ]);

    if (createdRecipe.isPublic) {
      await insertRecipeQueryIndex({
        id: recipeId,
        title: createdRecipe.title
      });
    }

    await Promise.all([
      removeCacheKeys(`user_${user.id}_created_recipes_count`),
      removeCacheKeys(`user_${user.id}_saved_recipes*`)
    ]);

    return {
      success: true as const,
      recipeId
    };
  });

export const updateRecipe = authActionClient
  .inputSchema(EditRecipeFormSchema.omit({ image: true }))
  .action(async ({ 
    ctx: { user },
    parsedInput: editedRecipe
  }) => {
    const foundRecipe = await db.query.recipe.findFirst({
      where: (recipe, { eq }) => eq(recipe.id, editedRecipe.id),
      columns: {
        id: true,
        title: true,
        createdBy: true,
        image: true
      }
    });

    if (!foundRecipe) throw new ActionError("Recipe does not exist.");
    if (foundRecipe.createdBy !== user.id) throw new ActionError("You are not authorized to edit this recipe.");

    const updateRecipeQuery = db.update(recipe)
      .set({
        title: editedRecipe.title,
        description: editedRecipe.description || null,
        isPublic: editedRecipe.isPublic,
        cuisineId: editedRecipe.cuisine?.id || null,
        sourceName: editedRecipe.source?.name || null,
        sourceUrl: editedRecipe.source?.url || null,
        servingSizeAmount: editedRecipe.servingSize.amount,
        servingSizeUnit: editedRecipe.servingSize.unit,
        cookTime: editedRecipe.cookTime,
        prepTime: editedRecipe.prepTime,
        readyTime: editedRecipe.readyTime,
        tags: editedRecipe.tags,
        updatedAt: new Date(),
      })
      .where(eq(recipe.id, foundRecipe.id));
    
    const deleteRecipeToNutritionQuery = db.delete(recipeToNutrition)
      .where(eq(recipeToNutrition.recipeId, foundRecipe.id));

    const insertRecipeToNutritionQuery = editedRecipe.nutrition.length > 0 ? db.insert(recipeToNutrition)
      .values(editedRecipe.nutrition.map((n) => ({
        recipeId: foundRecipe.id,
        nutritionId: n.id,
        amount: n.amount,
        unit: n.unit
      }))) : undefined;

    const deleteIngredientsQuery = db.delete(ingredient)
      .where(eq(ingredient.recipeId, foundRecipe.id));

    const insertIngredientsQuery = editedRecipe.ingredients.length > 0 ? db.insert(ingredient)
      .values(editedRecipe.ingredients.map((i) => ({
        recipeId: foundRecipe.id,
        name: i.name,
        amount: i.amount,
        unit: i.unit,
        note: i.note
      }))) : undefined;

    const deleteRecipeToDietQuery = db.delete(recipeToDiet)
      .where(eq(recipeToDiet.recipeId, foundRecipe.id));
    
    const insertRecipeToDietQuery = editedRecipe.diets.length > 0 ? db.insert(recipeToDiet)
      .values(editedRecipe.diets.map((d) => ({
        recipeId: foundRecipe.id,
        dietId: d.id
      }))) : undefined;

    const deleteRecipeToDishTypeQuery = db.delete(recipeToDishType)
      .where(eq(recipeToDishType.recipeId, foundRecipe.id));
    
    const insertRecipeToDishTypeQuery = editedRecipe.dishTypes.length > 0 ? db.insert(recipeToDishType)
      .values(editedRecipe.dishTypes.map((dt) => ({
        recipeId: foundRecipe.id,
        dishTypeId: dt.id
      }))) : undefined;

    const deleteInstructionsQuery = db.delete(instruction)
      .where(eq(instruction.recipeId, foundRecipe.id));

    const insertInstructionsQuery = editedRecipe.instructions.length > 0 ? db.insert(instruction)
      .values(editedRecipe.instructions.map((inst, i) => ({
        recipeId: foundRecipe.id,
        title: inst.title,
        description: inst.description,
        index: i + 1,
        time: inst.time
      }))) : undefined;

    await Promise.all([
      updateRecipeQuery,
      deleteRecipeToNutritionQuery,
      deleteIngredientsQuery,
      deleteRecipeToDietQuery,
      deleteRecipeToDishTypeQuery,
      deleteInstructionsQuery
    ]);

    await Promise.all([
      insertRecipeToNutritionQuery,
      insertIngredientsQuery,
      insertRecipeToDietQuery,
      insertRecipeToDishTypeQuery,
      insertInstructionsQuery
    ]);

    if (editedRecipe.isPublic) {
      await insertRecipeQueryIndex({
        id: foundRecipe.id,
        title: editedRecipe.title
      });
    } else {
      await deleteRecipeQueryIndex(foundRecipe.id);
    }

    await Promise.all([
      removeCacheKeys(`user_${user.id}_meals*`),
      removeCacheKeys(`user_${user.id}_saved_recipes*`)
    ]);

    return {
      success: true as const,
      recipeId: foundRecipe.id
    };
  });

export const deleteRecipe = authActionClient
  .inputSchema(IdSchema)
  .action(async ({ ctx: { user }, parsedInput: recipeId }) => {
    const foundRecipe = await db.query.recipe.findFirst({
      where: (recipe, { eq }) => eq(recipe.id, recipeId),
      columns: {
        id: true,
        createdBy: true,
        image: true
      }
    });

    if (!foundRecipe) throw new ActionError("Recipe does not exist.");
    if (user.id !== foundRecipe.createdBy) throw new ActionError("You are not authorized to delete this recipe.");

    const { url } = await generatePresignedUrlForImageDelete(foundRecipe.image);
    
    const deleteRecipeQuery = db.delete(recipe).where(eq(recipe.id, foundRecipe.id));
    const deleteCreatorSavedRecipeQuery = db.delete(savedRecipe).where(and(
      eq(savedRecipe.userId, user.id),
      eq(savedRecipe.recipeId, foundRecipe.id)
    ));

    const deleteImageOperation = axios.delete(url);
    const deleteRecipeQueryIndexOperation = deleteRecipeQueryIndex(foundRecipe.id);

    await Promise.all([
      deleteImageOperation,
      deleteRecipeQueryIndexOperation,
      deleteCreatorSavedRecipeQuery.then(() => deleteRecipeQuery)
    ]);

    // There is an edge case where a plan only has one meal, and that meal only has one recipe
    const deleteMealsQuery = db.delete(meal).where(
      notExists(
        db.select({ id: mealToRecipe.mealId })
          .from(mealToRecipe)
          .where(eq(mealToRecipe.mealId, meal.id))
      )
    );

    const deletePlansQuery = db.delete(plan).where(
      notExists(
        db.select({ id: planToMeal.planId })
          .from(planToMeal)
          .where(eq(planToMeal.planId, plan.id))
      )
    );

    await Promise.all([
      deleteMealsQuery.then(() => deletePlansQuery),
      removeCacheKeys(`user_${user.id}_created_recipes_count`),
      removeCacheKeys(`user_${user.id}_upcoming_plan`),
      removeCacheKeys(`user_${user.id}_meals*`),
      removeCacheKeys(`user_${user.id}_saved_recipes*`)
    ]);

    return {
      success: true as const,
      message: "Successfully deleted recipe!"
    };
  });

export const updateRecipeImage = authActionClient
  .inputSchema(z.object({
    recipeId: IdSchema,
    imageName: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "An image name is required."
        : "Expected a string, but received an invalid type."
    })
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
  .inputSchema(IdSchema)
  .action(async ({ ctx: { user }, parsedInput: recipeId }) => {
    let isFavorite = false;
    const foundFavoritedRecipe = await db.query.recipeFavorite.findFirst({
      where: (recipeFavorite, { eq, and }) => and(
        eq(recipeFavorite.userId, user.id),
        eq(recipeFavorite.recipeId, recipeId)
      ),
      columns: {
        userId: true,
        recipeId: true
      }
    });

    if (foundFavoritedRecipe) {
      const deleteRecipeFavoriteQuery = db.delete(recipeFavorite).where(and(
        eq(recipeFavorite.userId, foundFavoritedRecipe.userId),
        eq(recipeFavorite.recipeId, foundFavoritedRecipe.recipeId)
      ));

      const updateRecipeStatisticsQuery = db.update(recipeStatistics).set({
        favoriteCount: sql`${recipeStatistics.favoriteCount} - 1`
      }).where(eq(recipeStatistics.recipeId, recipeId));

      await Promise.all([deleteRecipeFavoriteQuery, updateRecipeStatisticsQuery]);
      isFavorite = false;
    } else {
      const insertRecipeFavoriteQuery = db.insert(recipeFavorite).values({
        userId: user.id,
        recipeId
      });

      const updateRecipeStatisticsQuery = db.update(recipeStatistics).set({
        favoriteCount: sql`${recipeStatistics.favoriteCount} + 1`
      }).where(eq(recipeStatistics.recipeId, recipeId));

      await Promise.all([insertRecipeFavoriteQuery, updateRecipeStatisticsQuery]);
      isFavorite = true;
    }

    await Promise.all([
      removeCacheKeys(`user_${user.id}_favorited_recipes_count`),
      removeCacheKeys(`user_${user.id}_saved_recipes*`)
    ]);

    return { 
      success: true as const,
      isFavorite
    };
  });

export const addRecipeToSavedList = authActionClient
  .inputSchema(IdSchema)
  .action(async ({
    ctx: { user },
    parsedInput: recipeId
  }) => {
    const insertSavedRecipeQuery = db.insert(savedRecipe).values({
      userId: user.id,
      recipeId
    });
    
    const updateRecipeStatisticsQuery = db.update(recipeStatistics)
      .set({ savedCount: sql`${recipeStatistics.savedCount} + 1` })
      .where(eq(recipeStatistics.recipeId, recipeId));

    await Promise.all([
      insertSavedRecipeQuery,
      updateRecipeStatisticsQuery,
      removeCacheKeys(`user_${user.id}_saved_recipes*`)
    ]);

    return {
      success: true as const,
      message: "Recipe successfully saved!",
    };
  });

export const deleteRecipeFromSavedList = authActionClient
  .inputSchema(IdSchema)
  .action(async ({
    ctx: { user },
    parsedInput: recipeId
  }) => {
    const foundSavedRecipe = await db.query.savedRecipe.findFirst({
      where: (savedRecipe, { eq, and }) => and(
        eq(savedRecipe.recipeId, recipeId),
        eq(savedRecipe.userId, user.id),
      ),
      columns: {
        userId: true,
        recipeId: true
      }
    });

    if (!foundSavedRecipe) throw new ActionError("Saved recipe does not exist.");
    if (foundSavedRecipe.userId !== user.id) throw new ActionError("You are not authorized to delete this saved recipe.");

    const deleteSavedRecipeQuery = db.delete(savedRecipe).where(and(
      eq(savedRecipe.userId, user.id),
      eq(savedRecipe.recipeId, recipeId)
    ));

    const updateRecipeStatisticsQuery = db.update(recipeStatistics)
      .set({ savedCount: sql`${recipeStatistics.savedCount} - 1` })
      .where(eq(recipeStatistics.recipeId, recipeId));

    await Promise.all([
      deleteSavedRecipeQuery,
      updateRecipeStatisticsQuery,
      removeCacheKeys(`user_${user.id}_saved_recipes*`)
    ]);

    return {
      success: true as const,
      message: "Recipe successfully removed from saved list!"
    };
  });

export const deleteSavedRecipeWithMissingContent = authActionClient
  .inputSchema(IdSchema)
  .action(async ({
    ctx: { user },
    parsedInput: savedRecipeId
  }) => {
    const foundSavedRecipe = await db.query.savedRecipe.findFirst({
      where: (savedRecipe, { eq, and }) => and(
        eq(savedRecipe.id, savedRecipeId),
        eq(savedRecipe.userId, user.id),
      ),
      columns: {
        userId: true,
        recipeId: true
      }
    });

    if (!foundSavedRecipe) throw new ActionError("Saved recipe does not exist.");

    await db.delete(savedRecipe)
      .where(eq(savedRecipe.id, savedRecipeId));

    if (foundSavedRecipe.recipeId) {
      await db.update(recipeStatistics)
        .set({ savedCount: sql`${recipeStatistics.savedCount} - 1` })
        .where(eq(recipeStatistics.recipeId, foundSavedRecipe.recipeId));
    }

    await removeCacheKeys(`user_${user.id}_saved_recipes*`);

    return {
      success: true as const,
      message: "Recipe successfully removed from saved list!"
    };
  });

export async function getRecipeNutrition(recipeId: string) {
  return db.select({
    id: nutrition.id,
    amount: recipeToNutrition.amount,
    unit: recipeToNutrition.unit,
    name: nutrition.name,
    description: nutrition.description
  }).from(recipeToNutrition)
    .where(eq(recipeToNutrition.recipeId, recipeId))
    .innerJoin(nutrition, eq(recipeToNutrition.nutritionId, nutrition.id))
    .orderBy(asc(nutrition.sortIndex));
}

export async function getRecipeIngredients(recipeId: string) {
  return db.select({
    id: ingredient.id,
    name: ingredient.name,
    amount: ingredient.amount,
    unit: ingredient.unit,
    note: ingredient.note
  }).from(ingredient)
    .where(eq(ingredient.recipeId, recipeId));
}

export async function getRecipeInstructions(recipeId: string) {
  return db.select({
    id: instruction.id,
    index: instruction.index,
    title: instruction.title,
    time: instruction.time,
    description: instruction.description
  }).from(instruction)
    .where(eq(instruction.recipeId, recipeId))
    .orderBy(asc(instruction.index));
}

export async function getReviewsByRecipe({ recipeId, limit, offset, userId }: { recipeId: string; limit: number; offset: number; userId?: string; }) {
  return db.query.recipeReview.findMany({
    where: (review, { eq, isNotNull, and }) => and(
      eq(review.recipeId, recipeId),
      isNotNull(review.content)
    ),
    columns: {
      userId: false,
      recipeId: false
    },
    with: {
      creator: {
        columns: {
          id: true,
          image: true,
          name: true,
          email: true
        }
      },
      likedBy: {
        where: (liked, { eq }) => eq(liked.userId, userId || ""),
        columns: {
          userId: true
        }
      }
    },
    limit,
    offset,
    orderBy: (review, { desc }) => [desc(review.createdAt)]
  });
}

export async function getRecipeReviewStatistics(recipeId: string) {
  const foundRecipeStatistics = await db.query.recipeStatistics.findFirst({
    where: (stats, { eq }) => eq(stats.recipeId, recipeId),
    columns: {
      savedCount: false,
      favoriteCount: false
    }
  });

  if (!foundRecipeStatistics) {
    return {
      overallRating: 0,
      oneStarCount: 0,
      twoStarCount: 0,
      threeStarCount: 0,
      fourStarCount: 0,
      fiveStarCount: 0,
    };
  }

  const totalReviewCount = 
    foundRecipeStatistics.fiveStarCount + 
    foundRecipeStatistics.fourStarCount + 
    foundRecipeStatistics.threeStarCount + 
    foundRecipeStatistics.twoStarCount + 
    foundRecipeStatistics.oneStarCount;

  const overallRating = (
    foundRecipeStatistics.fiveStarCount * 5 + 
    foundRecipeStatistics.fourStarCount * 4 + 
    foundRecipeStatistics.threeStarCount * 3 + 
    foundRecipeStatistics.twoStarCount * 2 + 
    foundRecipeStatistics.oneStarCount * 1
  ) / totalReviewCount || 0;

  return {
    overallRating: Number(overallRating.toFixed(1)),
    oneStarCount: foundRecipeStatistics.oneStarCount,
    twoStarCount: foundRecipeStatistics.twoStarCount,
    threeStarCount: foundRecipeStatistics.threeStarCount,
    fourStarCount: foundRecipeStatistics.fourStarCount,
    fiveStarCount: foundRecipeStatistics.fiveStarCount,
  };
}

export async function getRecipeStatistics(recipeId: string) {
  const foundRecipeStatistics = await db.query.recipeStatistics.findFirst({
    where: (stats, { eq }) => eq(stats.recipeId, recipeId),
    columns: { recipeId: false }
  });

  if (!foundRecipeStatistics) return null;

  const totalReviewCount = 
    foundRecipeStatistics.fiveStarCount + 
    foundRecipeStatistics.fourStarCount + 
    foundRecipeStatistics.threeStarCount + 
    foundRecipeStatistics.twoStarCount + 
    foundRecipeStatistics.oneStarCount;

  const overallRating = (
    foundRecipeStatistics.fiveStarCount * 5 + 
    foundRecipeStatistics.fourStarCount * 4 + 
    foundRecipeStatistics.threeStarCount * 3 + 
    foundRecipeStatistics.twoStarCount * 2 + 
    foundRecipeStatistics.oneStarCount * 1
  ) / totalReviewCount || 0;

  return {
    recipeId,
    overallRating: Number(overallRating.toFixed(1)),
    favoriteCount: foundRecipeStatistics.favoriteCount,
    savedCount: foundRecipeStatistics.savedCount
  };
}

export async function getRecipeReviewCount(recipeId: string) {
  const [{ count: reviewCount }] = await db.select({ count: count() })
    .from(recipeReview)
    .where(and(
      eq(recipeReview.recipeId, recipeId),
      isNotNull(recipeReview.content)
    ));

  return reviewCount;
}

export async function getUserReview({
  recipeId,
  userId
}: {
  recipeId: string;
  userId: string;
}) {
  const foundUser = await db.query.recipeReview.findFirst({
    where: (review, { eq, and }) => and(
      eq(review.recipeId, recipeId),
      eq(review.userId, userId)
    ),
    columns: {
      userId: false,
      recipeId: false
    },
    with: {
      creator: {
        columns: {
          id: true,
          image: true,
          name: true,
          email: true
        }
      },
      likedBy: {
        where: (liked, { eq }) => eq(liked.userId, userId || ""),
        columns: {
          userId: true
        }
      }
    }
  });

  return foundUser || null;
}

export const createReview = authActionClient
  .inputSchema(z.object({
    recipeId: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A recipe id is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Recipe ID cannot be empty."
    }),
    review: CreateReviewFormSchema
  }))
  .action(async ({ ctx: { user }, parsedInput: { recipeId, review } }) => {
    const foundRecipe = await db.query.recipe.findFirst({
      where: (recipe, { eq }) => eq(recipe.id, recipeId),
      columns: {
        id: true
      }
    });

    if (!foundRecipe) throw new ActionError("Recipe does not exist.");
    const foundReview = await db.query.recipeReview.findFirst({
      where: (review, { eq, and }) => and(
        eq(review.recipeId, recipeId),
        eq(review.userId, user.id)
      )
    });

    if (foundReview) throw new ActionError("You have already created a review for this recipe!");
    const insertRecipeReviewQuery = db.insert(recipeReview).values({
      recipeId,
      userId: user.id,
      rating: review.rating,
      content: review.content || undefined,
    }).returning();

    const insertedRating = getRatingKey(review.rating);
    const updateRecipeStatisticsQuery = db.update(recipeStatistics).set({
      [insertedRating]: sql`${recipeStatistics[insertedRating]} + 1`
    }).where(eq(recipeStatistics.recipeId, recipeId));

    const [[insertedReview]] = await Promise.all([insertRecipeReviewQuery, updateRecipeStatisticsQuery]);

    return {
      success: true as const,
      message: "Review successfully created!",
      review: insertedReview
    };
  });

export const deleteReview = authActionClient
  .inputSchema(z.object({
    reviewId: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A review id is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Review id cannot be empty."
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

    if (!deletedReview) throw new ActionError("Review does not exist.");
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
      message: "Review successfully removed!",
      reviewId: deletedReview.id
    };
  });

export const toggleReviewLike = authActionClient
  .inputSchema(z.object({
    reviewId: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A review id is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Review id cannot be empty."
    })
  }))
  .action(async ({ ctx: { user }, parsedInput: { reviewId } }) => {    
    const foundReviewLike = await db.query.reviewLike.findFirst({
      where: (reviewLike, { eq }) => eq(reviewLike.reviewId, reviewId)
    });

    if (!foundReviewLike) {
      const foundReview = await db.query.recipeReview.findFirst({
        where: (review, { eq }) => eq(review.id, reviewId)
      });

      if (!foundReview) throw new ActionError("Review does not exist.");
      await db.insert(reviewLike).values({
        reviewId,
        userId: user.id
      });

      const [{ likeCount: updatedLikeCount }] = await db.update(recipeReview)
        .set({ likeCount: sql`${recipeReview.likeCount} + 1` })
        .where(eq(recipeReview.id, reviewId))
        .returning({
          likeCount: recipeReview.likeCount
        });

      return {
        success: true as const,
        isLiked: true,
        likeCount: updatedLikeCount
      };
    }

    const deleteReviewLikeQuery = db.delete(reviewLike).where(eq(reviewLike.reviewId, reviewId));
    const updateRecipeReview = db.update(recipeReview)
      .set({ likeCount: sql`${recipeReview.likeCount} - 1` })
      .where(eq(recipeReview.id, reviewId))
      .returning({ likeCount: recipeReview.likeCount });

    const [[{ likeCount: updatedLikedCount }]] = await Promise.all([updateRecipeReview, deleteReviewLikeQuery]);

    return {
      success: true as const,
      isLiked: false,
      likeCount: updatedLikedCount
    };
  });

export async function getInfiniteSearchedRecipes({
  userId,
  limit = MAX_GRID_RECIPE_DISPLAY_LIMIT,
  offset = 0,
  query = "",
  diet,
  dishType,
  cuisine,
  isUsingCuisinePreferences = false,
  isUsingDietPreferences = false,
  isUsingDishTypePreferences = false
}: {
  userId: string;
  limit?: number;
  offset?: number;
  query?: string;
  diet?: string;
  dishType?: string;
  cuisine?: string;
  isUsingCuisinePreferences?: boolean;
  isUsingDietPreferences?: boolean;
  isUsingDishTypePreferences?: boolean;
}): Promise<{
  id: string;
  title: string;
  image: string;
  prepTime: number;
  calories: number;
  creator: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  statistics: {
    saveCount: number;
    favoriteCount: number;
    fiveStarCount: number;
    fourStarCount: number;
    threeStarCount: number;
    twoStarCount: number;
    oneStarCount: number;
  };
  cuisine: {
    id: string;
    adjective: string;
    icon: string;
  } | null;
  sourceName: string | null;
  sourceUrl: string | null;
  cuisineScore: number;
  dietScore: number;
  dishTypeScore: number;
  createdAt: Date;
}[]> {
  const creatorSubQuery = db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image
  }).from(user)
    .where(eq(recipe.createdBy, user.id))
    .as("creator_sub");

  const recipeStatisticsSubQuery = db.select({
    savedCount: recipeStatistics.savedCount,
    favoriteCount: recipeStatistics.favoriteCount,
    fiveStarCount: recipeStatistics.fiveStarCount,
    fourStarCount: recipeStatistics.fourStarCount,
    threeStarCount: recipeStatistics.threeStarCount,
    twoStarCount: recipeStatistics.twoStarCount,
    oneStarCount: recipeStatistics.oneStarCount
  }).from(recipeStatistics)
    .where(eq(recipeStatistics.recipeId, recipe.id))
    .as("recipe_stats_sub");

  const cuisineSubQuery = db.select({
    id: cuisineTable.id,
    adjective: cuisineTable.adjective,
    icon: cuisineTable.icon
  }).from(cuisineTable)
    .where(eq(cuisineTable.id, recipe.cuisineId))
    .as("cuisine_sub");

  const caloriesSubQuery = db.select({
    calories: recipeToNutrition.amount
  }).from(recipeToNutrition)
    .where(and(
      eq(recipeToNutrition.recipeId, recipe.id),
      eq(nutrition.name, "Calories")
    ))
    .innerJoin(nutrition, eq(recipeToNutrition.nutritionId, nutrition.id))
    .as("recipe_to_nutrition_sub");

  const cuisinePreferencesScoreQuery = db.select({ 
    score: userToCuisine.preferenceScore
  }).from(userToCuisine)
    .where(and(
      eq(userToCuisine.userId, userId),
      eq(userToCuisine.cuisineId, recipe.cuisineId)
    ))
    .orderBy(userToCuisine.preferenceScore)
    .innerJoin(cuisineTable, eq(userToCuisine.cuisineId, cuisineTable.id))
    .as("cuisine_preferences");

  const dietPreferencesScoreQuery = db.select({
    totalScore: sql<number>`coalesce(sum(${userToDiet.preferenceScore})::integer, 0)`.as("diet_total_score")
  }).from(userToDiet)
    .where(and(
      eq(userToDiet.userId, userId),
      exists(
        db.select({ id: recipeToDiet.dietId })
          .from(recipeToDiet)
          .where(and(
            eq(recipeToDiet.recipeId, recipe.id),
            eq(recipeToDiet.dietId, userToDiet.dietId),
            eq(recipeToDiet.dietId, dietTable.id)
          ))
      )
    ))
    .innerJoin(dietTable, eq(userToDiet.dietId, dietTable.id))
    .as("diet_preferences");

  const dishTypePreferencesScoreQuery = db.select({
    totalScore: sql<number>`coalesce(sum(${userToDishType.preferenceScore})::integer, 0)`.as("dish_type_total_score")
  }).from(userToDishType)
    .where(and(
      eq(userToDishType.userId, userId),
      exists(
        db.select({ id: recipeToDishType.dishTypeId })
          .from(recipeToDishType)
          .where(and(
            eq(recipeToDishType.recipeId, recipe.id),
            eq(recipeToDishType.dishTypeId, userToDishType.dishTypeId),
            eq(recipeToDishType.dishTypeId, dishTypeTable.id)
          ))
      )
    ))
    .innerJoin(dishTypeTable, eq(userToDishType.dishTypeId, dishTypeTable.id))
    .as("dish_type_preferences");

  const preferencesOrdering = [
    isUsingCuisinePreferences ? desc(sql`coalesce(${cuisinePreferencesScoreQuery.score}, 0)`) : undefined,
    isUsingDietPreferences ? desc(dietPreferencesScoreQuery.totalScore) : undefined,
    isUsingDishTypePreferences ? desc(dishTypePreferencesScoreQuery.totalScore) : undefined,
    desc(recipeStatisticsSubQuery.savedCount),
    asc(recipe.title),
    asc(recipe.id)
  ];

  const searchedRecipes = db.select({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    prepTime: recipe.prepTime,
    calories: sql<number>`coalesce(${caloriesSubQuery.calories}::integer, 0)`.as("calories"),
    creator: {
      id: creatorSubQuery.id,
      name: creatorSubQuery.name,
      email: creatorSubQuery.email,
      image: creatorSubQuery.image
    },
    statistics: {
      saveCount: recipeStatisticsSubQuery.savedCount,
      favoriteCount: recipeStatisticsSubQuery.favoriteCount,
      fiveStarCount: recipeStatisticsSubQuery.fiveStarCount,
      fourStarCount: recipeStatisticsSubQuery.fourStarCount,
      threeStarCount: recipeStatisticsSubQuery.threeStarCount,
      twoStarCount: recipeStatisticsSubQuery.twoStarCount,
      oneStarCount: recipeStatisticsSubQuery.oneStarCount
    },
    cuisine: {
      id: cuisineSubQuery.id,
      adjective: cuisineSubQuery.adjective,
      icon: cuisineSubQuery.icon
    },
    sourceName: recipe.sourceName,
    sourceUrl: recipe.sourceUrl,
    cuisineScore: sql`coalesce(${cuisinePreferencesScoreQuery.score}::integer, 0)`.mapWith(Number),
    dietScore: dietPreferencesScoreQuery.totalScore,
    dishTypeScore: dishTypePreferencesScoreQuery.totalScore,
    createdAt: recipe.createdAt
  }).from(recipe)
    .where(and(
      eq(recipe.isPublic, true),
      ilike(recipe.title, `%${query}%`),
      diet ? exists(
        db.select({ id: recipeToDiet.dietId })
          .from(recipeToDiet)
          .innerJoin(dietTable, eq(recipeToDiet.dietId, dietTable.id))
          .where(and(
            eq(recipeToDiet.recipeId, recipe.id),
            eq(dietTable.name, diet),
          ))
      ) : undefined,
      dishType ? exists(
        db.select({ id: recipeToDishType.dishTypeId })
          .from(recipeToDishType)
          .innerJoin(dishTypeTable, eq(recipeToDishType.dishTypeId, dishTypeTable.id))
          .where(and(
            eq(recipeToDishType.recipeId, recipe.id),
            eq(dishTypeTable.name, dishType),
          ))
      ) : undefined,
      cuisine ? exists(
        db.select({ id: cuisineTable.id })
          .from(cuisineTable)
          .where(and(
            eq(cuisineTable.id, recipe.cuisineId),
            eq(cuisineTable.adjective, cuisine)
          ))
      ) : undefined
    ))
    .leftJoinLateral(creatorSubQuery, sql`true`)
    .innerJoinLateral(recipeStatisticsSubQuery, sql`true`)
    .leftJoinLateral(cuisineSubQuery, sql`true`)
    .leftJoinLateral(caloriesSubQuery, sql`true`)
    .leftJoinLateral(cuisinePreferencesScoreQuery, sql`true`)
    .leftJoinLateral(dietPreferencesScoreQuery, sql`true`)
    .leftJoinLateral(dishTypePreferencesScoreQuery, sql`true`)
    .limit(limit)
    .orderBy(...preferencesOrdering.filter((o) => !!o))
    .offset(offset);

  return searchedRecipes;
}
