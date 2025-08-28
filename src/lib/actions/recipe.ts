"use server";

import { ActionError } from "@/lib/types";
import { authActionClient } from "@/safe-action";
import { db } from "@/db";
import { and, asc, count, eq, isNotNull, sql } from "drizzle-orm";
import { CreateRecipeFormSchema, EditRecipeFormSchema, CreateReviewFormSchema } from "@/lib/zod/recipe";
import { ingredient, instruction, nutrition, recipe, recipeFavorite, recipeReview, recipeStatistics, recipeToDiet, recipeToDishType, recipeToNutrition, reviewLike, savedRecipe } from "@/db/schema";
import { deleteRecipeQueryIndex, insertRecipeQueryIndex } from "@/lib/actions/algolia";
import { revalidatePath } from "next/cache";
import { generatePresignedUrlForImageDelete } from "@/lib/actions/r2";
import { getRatingKey } from "@/lib/utils";
import axios from "axios";
import { removeCacheKeys } from "@/lib/actions/redis";
import z from "zod/v4";

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
        isAllergen: i.isAllergen,
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

    await removeCacheKeys(`user_${user.id}_created_recipes_count`);
    revalidatePath("/recipes");

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
        isAllergen: i.isAllergen,
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
    
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${foundRecipe.id}`);
    revalidatePath(`/recipes/${foundRecipe.id}/edit`);
    revalidatePath("/meals");
    revalidatePath("/plans");

    return {
      success: true as const,
      recipeId: foundRecipe.id
    };
  });

export const deleteRecipe = authActionClient
  .inputSchema(z.object({
    recipeId: z.string()
      .nonempty({
        message: "Recipe ID must not be empty."
      })
  }))
  .action(async ({ ctx: { user }, parsedInput: { recipeId } }) => {
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
    const deleteImageOperation = axios.delete(url);
    const deleteRecipeQuery = db.delete(recipe).where(eq(recipe.id, foundRecipe.id));
    const deleteRecipeQueryIndexOperation = deleteRecipeQueryIndex(foundRecipe.id);
    const removeCacheKeyOperation = removeCacheKeys(`user_${user.id}_created_recipes_count`);

    await Promise.all([deleteImageOperation, deleteRecipeQuery, deleteRecipeQueryIndexOperation, removeCacheKeyOperation]);
    revalidatePath("/recipes");

    return {
      success: true as const,
      message: "Successfully deleted recipe!"
    };
  });

export const updateRecipeImage = authActionClient
  .inputSchema(z.object({
    recipeId: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A recipe id is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
        error: "Recipe id must not be empty."
      }),
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
  .inputSchema(z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A recipe id is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    message: "Recipe id cannot be empty."
  }))
  .action(async ({ ctx: { user }, parsedInput: recipeId }) => {
    let isFavorite = false;
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
        userId: user.id!,
        recipeId
      });

      const updateRecipeStatisticsQuery = db.update(recipeStatistics).set({
        favoriteCount: sql`${recipeStatistics.favoriteCount} + 1`
      }).where(eq(recipeStatistics.recipeId, recipeId));

      await Promise.all([insertRecipeFavoriteQuery, updateRecipeStatisticsQuery]);
      isFavorite = true;
    }

    await removeCacheKeys(`user_${user.id}_favorited_recipes_count`);
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${recipeId}`);

    return { 
      success: true as const,
      isFavorite
    };
  });

export const toggleSavedListRecipe = authActionClient
  .inputSchema(z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A recipe id is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Recipe id cannot be empty."
    })
  )
  .action(async ({ ctx: { user }, parsedInput: recipeId }) => {
    let isSaved = false;
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

    if (foundSavedRecipe) {
      const deleteSavedRecipeQuery = db.delete(savedRecipe).where(and(
        eq(savedRecipe.userId, foundSavedRecipe.userId),
        eq(savedRecipe.recipeId, foundSavedRecipe.recipeId)
      ));

      const updateRecipeStatisticsQuery = db.update(recipeStatistics)
        .set({ savedCount: sql`${recipeStatistics.savedCount} - 1` })
        .where(eq(recipeStatistics.recipeId, foundSavedRecipe.recipeId));

      await Promise.all([deleteSavedRecipeQuery, updateRecipeStatisticsQuery]);
      isSaved = false;
    } else {
      const insertSavedRecipeQuery = db.insert(savedRecipe).values({
        userId: user.id!,
        recipeId
      });
      
      const updateRecipeStatisticsQuery = db.update(recipeStatistics)
        .set({ savedCount: sql`${recipeStatistics.savedCount} + 1` })
        .where(eq(recipeStatistics.recipeId, recipeId));

      await Promise.all([insertSavedRecipeQuery, updateRecipeStatisticsQuery]);
      isSaved = true;
    }

    await removeCacheKeys(`user_${user.id}_saved_recipes_count`);
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${recipeId}`);

    return {
      success: true as const,
      isSaved
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
    isAllergen: ingredient.isAllergen,
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
        eq(review.userId, user.id!)
      )
    });

    if (foundReview) throw new ActionError("You have already created a review for this recipe!");
    const insertRecipeReviewQuery = db.insert(recipeReview).values({
      recipeId,
      userId: user.id!,
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
        userId: user.id!
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
