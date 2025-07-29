"use server";

import { ActionError } from "@/lib/types";
import { authActionClient } from "@/safe-action";
import { db } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { CreateRecipeFormSchema, EditRecipeFormSchema, CreateReviewFormSchema } from "@/lib/zod/recipe";
import { ingredient, instruction, recipe, recipeFavorite, recipeReview, recipeStatistics, recipeToDiet, recipeToDishType, recipeToNutrition, reviewLike, savedRecipe } from "@/db/schema";
import { deleteRecipeQueryIndex, insertRecipeQueryIndex } from "@/lib/actions/algolia";
import { revalidatePath } from "next/cache";
import { generatePresignedUrlForImageDelete } from "@/lib/actions/r2";
import { getRatingKey } from "@/lib/utils";
import axios from "axios";
import z from "zod";

export const createRecipe = authActionClient
  .schema(CreateRecipeFormSchema.omit({ image: true }))
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
    
    const insertRecipeStatisticsQuery = db.insert(recipeStatistics)
      .values({ 
        recipeId,
        savedCount: 1
      });

    const insertSavedRecipeQuery = db.insert(savedRecipe)
      .values({
        recipeId,
        userId: user.id!
      });
    
    const insertNutritionQuery = createdRecipe.nutrition.length > 0 ? db.insert(recipeToNutrition)
      .values(createdRecipe.nutrition.map((n) => ({
        recipeId,
        nutritionId: n.id,
        amount: n.amount.toFixed(2),
        unit: n.unit
      }))) : undefined;

    const insertIngredientsQuery = createdRecipe.ingredients.length > 0 ? db.insert(ingredient)
      .values(createdRecipe.ingredients.map((i) => ({
        recipeId,
        name: i.name,
        amount: i.amount.toFixed(2),
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
        time: inst.time.toFixed(2)
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

    revalidatePath("/recipes");

    return {
      success: true as const,
      recipeId
    };
  });

export const updateRecipe = authActionClient
  .schema(EditRecipeFormSchema.omit({ image: true }))
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
        servingSizeAmount: editedRecipe.servingSize.amount.toFixed(2),
        servingSizeUnit: editedRecipe.servingSize.unit,
        cookTime: editedRecipe.cookTime.toFixed(2),
        prepTime: editedRecipe.prepTime.toFixed(2),
        readyTime: editedRecipe.readyTime.toFixed(2),
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
        amount: n.amount.toFixed(2),
        unit: n.unit
      }))) : undefined;

    const deleteIngredientsQuery = db.delete(ingredient)
      .where(eq(ingredient.recipeId, foundRecipe.id));

    const insertIngredientsQuery = editedRecipe.ingredients.length > 0 ? db.insert(ingredient)
      .values(editedRecipe.ingredients.map((i) => ({
        recipeId: foundRecipe.id,
        name: i.name,
        amount: i.amount.toFixed(2),
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
        time: inst.time.toFixed(2)
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
  .schema(z.object({
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

    await Promise.all([deleteImageOperation, deleteRecipeQuery, deleteRecipeQueryIndexOperation]);
    revalidatePath("/recipes");

    return {
      success: true as const,
      message: "Successfully deleted recipe!"
    };
  });

export const updateRecipeImage = authActionClient
  .schema(z.object({
    recipeId: z.string()
      .nonempty({
        message: "Recipe ID must not be empty."
      }),
    imageName: z.string({
      required_error: "An image name is required."
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
  .schema(z.object({
    recipeId: z.string().nonempty({
      message: "Recipe ID cannot be empty."
    })
  }))
  .action(async ({ ctx: { user }, parsedInput: { recipeId } }) => {
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

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${recipeId}`);

    return { 
      success: true as const,
      isFavorite
    };
  });

export const toggleSavedListRecipe = authActionClient
  .schema(z.object({
    recipeId: z.string({
      required_error: "A recipe ID is required."
    }).nonempty({
      message: "Recipe ID cannot be empty."
    })
  }))
  .action(async ({ ctx: { user }, parsedInput: { recipeId } }) => {
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

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${recipeId}`);

    return {
      success: true as const,
      isSaved
    };
  });

export const createReview = authActionClient
  .schema(z.object({
    recipeId: z.string().nonempty({
      message: "Recipe ID cannot be empty."
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
    }).returning({
      insertedReviewId: recipeReview.id
    });

    const insertedRating = getRatingKey(review.rating);
    const updateRecipeStatisticsQuery = db.update(recipeStatistics).set({
      [insertedRating]: sql`${recipeStatistics[insertedRating]} + 1`
    }).where(eq(recipeStatistics.recipeId, recipeId));

    const [[{ insertedReviewId }]] = await Promise.all([insertRecipeReviewQuery, updateRecipeStatisticsQuery]);

    return {
      success: true as const,
      review: insertedReviewId
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
      message: "Review successfully removed!"
    };
  });

export const toggleReviewLike = authActionClient
  .schema(z.object({
    reviewId: z.string().nonempty({
      message: "Review ID cannot be empty."
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

      await db.update(recipeReview)
        .set({ likeCount: sql`${recipeReview.likeCount} + 1` })
        .where(eq(recipeReview.id, reviewId));

      return {
        success: true as const,
        isLiked: true
      };
    }

    const deleteReviewLikeQuery = db.delete(reviewLike).where(eq(reviewLike.reviewId, reviewId));
    const updateRecipeReview = db.update(recipeReview)
      .set({
        likeCount: sql`${recipeReview.likeCount} - 1`
      })
      .where(eq(recipeReview.id, reviewId));

    await Promise.all([deleteReviewLikeQuery, updateRecipeReview]);

    return {
      success: true as const,
      isLiked: false
    };
  });

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
