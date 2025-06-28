"use server";

import { authActionClient } from "@/safe-action";
import {
  ImageDataSchema,
  MealCreationSchema,
  MealEditionSchema,
  PlanCreationSchema,
  RecipeCreationSchema,
  RecipeEditionSchema,
  RecipeSearchIndexDeletionSchema,
  RecipeSearchIndexInsertionSchema,
  RecipeSearchIndexSchema,
  ReviewCreationSchema
} from "@/lib/zod";
import { db } from "@/db";
import { and, count, desc, eq, exists, ilike, sql } from "drizzle-orm";
import z from "zod";
import { 
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
  savedRecipe
} from "@/db/schema";
import { getRatingKey } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/r2-client";
import axios from "axios";
import { searchClient, writeClient } from "@/algolia";
import { format } from "date-fns";

export async function generatePresignedUrlForImageUpload(params: { name: string; type: string; size: number; }) {
  const parsedBody = ImageDataSchema.safeParse(params);

  if (!parsedBody.success)
    throw new Error(parsedBody.error.errors[0].message);
  
  const { name, type, size } = ImageDataSchema.parse(params);

  const putCommand = new PutObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_IMAGE_BUCKET_NAME!,
    Key: name,
    ContentType: type,
    ContentLength: size
  });

  const url = await getSignedUrl(r2, putCommand, { expiresIn: 60 });

  return {
    success: true as const,
    url
  };
}

export async function generatePresignedUrlForImageDelete(imageLink: string) {
  const putCommand = new DeleteObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_IMAGE_BUCKET_NAME!,
    Key: imageLink.replace(`${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL!}/`, "")
  });

  const url = await getSignedUrl(r2, putCommand, { expiresIn: 60 });

  return {
    success: true as const,
    url
  };
}

export const createRecipe = authActionClient
  .schema(z.object({
    createdRecipe: RecipeCreationSchema.omit({ image: true })
  }))
  .action(async ({ 
    ctx: { user },
    parsedInput: { createdRecipe }
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
  .schema(z.object({
    editedRecipe: RecipeEditionSchema.omit({ image: true })
  }))
  .action(async ({ 
    ctx: { user },
    parsedInput: { editedRecipe }
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

    if (!foundRecipe)
      throw new Error("Recipe does not exist.");

    if (foundRecipe.createdBy !== user.id)
      throw new Error("You are not authorized to edit this recipe.");

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
    revalidatePath(`/recipes/${foundRecipe.id}/edit`)

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

    if (!foundRecipe)
      throw new Error("Recipe does not exist.");

    if (user.id !== foundRecipe.createdBy)
      throw new Error("You are not authorized to delete this recipe.");

    const { url } = await generatePresignedUrlForImageDelete(foundRecipe.image);
    await axios.delete(url);
    await db.delete(recipe).where(eq(recipe.id, foundRecipe.id));

    await deleteRecipeQueryIndex(foundRecipe.id);
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
      await db.delete(recipeFavorite).where(and(
        eq(recipeFavorite.userId, foundFavoritedRecipe.userId),
        eq(recipeFavorite.recipeId, foundFavoritedRecipe.recipeId)
      ));

      await db.update(recipeStatistics).set({
        favoriteCount: sql`${recipeStatistics.favoriteCount} - 1`
      }).where(eq(recipeStatistics.recipeId, recipeId));

      isFavorite = false;
    } else {
      await db.insert(recipeFavorite).values({
        userId: user.id!,
        recipeId
      });

      await db.update(recipeStatistics).set({
        favoriteCount: sql`${recipeStatistics.favoriteCount} + 1`
      }).where(eq(recipeStatistics.recipeId, recipeId));

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
    recipeId: z.string().nonempty({
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
      await db.delete(savedRecipe).where(and(
        eq(savedRecipe.userId, foundSavedRecipe.userId),
        eq(savedRecipe.recipeId, foundSavedRecipe.recipeId)
      ));

      await db.update(recipeStatistics)
        .set({ savedCount: sql`${recipeStatistics.savedCount} - 1` })
        .where(eq(recipeStatistics.recipeId, foundSavedRecipe.recipeId));
      
      isSaved = false;
    } else {
      await db.insert(savedRecipe).values({
        userId: user.id!,
        recipeId
      });
      
      await db.update(recipeStatistics)
        .set({ savedCount: sql`${recipeStatistics.savedCount} + 1` })
        .where(eq(recipeStatistics.recipeId, recipeId));

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
    review: ReviewCreationSchema
  }))
  .action(async ({ ctx: { user }, parsedInput: { recipeId, review } }) => {
    const foundRecipe = await db.query.recipe.findFirst({
      where: (recipe, { eq }) => eq(recipe.id, recipeId),
      columns: {
        id: true
      }
    });

    if (!foundRecipe)
      throw new Error("Recipe does not exist.");

    const foundReview = await db.query.recipeReview.findFirst({
      where: (review, { eq, and }) => and(
        eq(review.recipeId, recipeId),
        eq(review.userId, user.id!)
      )
    });

    if (foundReview)
      throw new Error("You have already created a review for this recipe!");

    const [{ insertedReviewId }] = await db.insert(recipeReview).values({
      recipeId,
      userId: user.id!,
      rating: review.rating,
      content: review.content || undefined,
    }).returning({
      insertedReviewId: recipeReview.id
    });

    const insertedRating = getRatingKey(review.rating);

    await db.update(recipeStatistics).set({
      [insertedRating]: sql`${recipeStatistics[insertedRating]} + 1`
    }).where(eq(recipeStatistics.recipeId, recipeId));

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

      if (!foundReview)
        throw new Error("Review does not exist.");
      
      await db.insert(reviewLike).values({
        reviewId,
        userId: user.id!
      });

      await db.update(recipeReview)
        .set({
          likeCount: sql`${recipeReview.likeCount} + 1`
        })
        .where(eq(recipeReview.id, reviewId));

      return {
        success: true as const,
        isLiked: true
      };
    }

    await db.delete(reviewLike).where(eq(reviewLike.reviewId, reviewId));

    await db.update(recipeReview)
      .set({
        likeCount: sql`${recipeReview.likeCount} - 1`
      })
      .where(eq(recipeReview.id, reviewId));

    return {
      success: true as const,
      isLiked: false
    };
  });

export const createMeal = authActionClient
  .schema(z.object({
    createdMeal: MealCreationSchema
  }))
  .action(async ({
    ctx: { user },
    parsedInput: { createdMeal }
  }) => {
    const [{ mealId }] = await db.insert(meal)
      .values({
        title: createdMeal.title,
        description: createdMeal.description || undefined,
        createdBy: user.id!,
        tags: createdMeal.tags,
        type: createdMeal.type
      })
      .returning({
        mealId: meal.id
      });

    await db.insert(mealToRecipe)
      .values(createdMeal.recipes.map((r) => ({
        mealId: mealId,
        recipeId: r.id
      })));

    revalidatePath("/meals");

    return {
      success: true as const,
      message: "Meal successfully created!"
    };
  });

export const updateMeal = authActionClient
  .schema(z.object({
    editedMeal: MealEditionSchema
  }))
  .action(async ({ ctx: { user }, parsedInput: { editedMeal } }) => {
    const foundMeal = await db.query.meal.findFirst({
      where: (meal, { eq }) => eq(meal.id, editedMeal.id),
      columns: {
        id: true,
        createdBy: true
      }
    });

    if (!foundMeal)
      throw new Error("Meal does not exist.");

    if (foundMeal.createdBy !== user.id)
      throw new Error("You are not authorized to edit this meal.");

    const updateMealQuery = db.update(meal)
      .set({
        title: editedMeal.title,
        description: editedMeal.description || undefined,
        tags: editedMeal.tags,
        type: editedMeal.type,
        updatedAt: new Date()
      })
      .where(eq(meal.id, foundMeal.id));

    const deleteMealToRecipeQuery = db.delete(mealToRecipe)
      .where(eq(mealToRecipe.mealId, foundMeal.id));

    await Promise.all([
      updateMealQuery,
      deleteMealToRecipeQuery
    ]);

    await db.insert(mealToRecipe)
      .values(editedMeal.recipes.map((r) => ({
        mealId: foundMeal.id,
        recipeId: r.id
      })));

    revalidatePath("/meals");

    return {
      success: true as const,
      message: "Meal successfully edited!"
    };
  });

export const deleteMeal = authActionClient
  .schema(z.object({
    mealId: z.string().nonempty({
      message: "Meal ID cannot be empty."
    })
  }))
  .action(async ({ 
    ctx: { user },
    parsedInput: { mealId }
  }) => {
    const foundMeal = await db.query.meal.findFirst({
      where: (meal, { eq }) => eq(meal.id, mealId),
      columns: {
        id: true,
        createdBy: true
      }
    });

    if (!foundMeal)
      throw new Error("Meal does not exist.");

    if (foundMeal.createdBy !== user.id)
      throw new Error("You are not authorized to delete this meal.");

    await db.delete(meal).where(eq(meal.id, foundMeal.id));

    revalidatePath("/meals");

    return {
      success: true as const,
      message: "Meal successfully deleted!"
    };
  });

export const createPlan = authActionClient
  .schema(z.object({
    createdPlan: PlanCreationSchema
  }))
  .action(async ({
    ctx: { user },
    parsedInput: { createdPlan }
  }) => {
    const [{ planId }] = await db.insert(plan).values({
      title: createdPlan.title,
      description: createdPlan.description || undefined,
      tags: createdPlan.tags,
      createdBy: user.id,
      date: createdPlan.date
    }).returning({
      planId: plan.id
    });

    await db.insert(planToMeal).values(createdPlan.meals.map((m) => ({
      planId,
      mealId: m.id,
      time: format(m.time, "HH:mm:00")
    })));

    return {
      success: true,
      message: "Plan successfully created!"
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

export async function searchForRecipesQueryIndices(query: string) {
  const response = await searchClient.search({
    requests: [{
      indexName: process.env.SEARCH_INDEXING_NAME!,
      query,
      hitsPerPage: 4
    }]
  });

  const { results } = RecipeSearchIndexSchema.parse(response);
  return results[0].hits;
}

export async function insertRecipeQueryIndex(props: { id: string; title: string; }) {
  const { objectID, title } = RecipeSearchIndexInsertionSchema.parse({
    objectID: props.id,
    title: props.title
  });
  
  await writeClient.addOrUpdateObject({
    indexName: process.env.SEARCH_INDEXING_NAME!,
    objectID,
    body: { title }
  });

  return {
    success: true as const,
    message: "Recipe query index successfully inserted!"
  };
}

export async function deleteRecipeQueryIndex(recipeId: string) {
  const { objectID } = RecipeSearchIndexDeletionSchema.parse({ objectID: recipeId });
  
  await writeClient.deleteObject({
    indexName: process.env.SEARCH_INDEXING_NAME!,
    objectID
  });

  return {
    success: true as const,
    message: "Recipe query index successfully deleted!"
  };
}

export async function getSavedRecipesForMealForm({ userId, query, limit, offset }: { userId: string; query: string; limit: number; offset: number; }) {
  return db.select({
    recipes: sql<{
      id: string;
      title: string;
      image: string;
      description: string | null;
    }[]>`
      coalesce(
        json_agg("saved_recipe_sub"."data"),
        '[]'::json
      )
    `.as("recipes")
  }).from(
      db.select({ 
        data: sql`
          json_build_object(
            'id', ${recipe.id},
            'title', ${recipe.title},
            'image', ${recipe.image},
            'description', ${recipe.description}
          )
        `.as("data")
      }).from(savedRecipe)
        .where(and(
          eq(savedRecipe.userId, userId),
          ilike(recipe.title, `%${query}%`)
        ))
        .innerJoin(recipe, eq(savedRecipe.recipeId, recipe.id))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(savedRecipe.saveDate))
        .as("saved_recipe_sub")
    );
}

export async function getSavedRecipesForMealFormCount({ userId, query }: { userId: string, query: string }) {
  return db.select({ count: count() })
    .from(savedRecipe)
    .where(and(
      eq(savedRecipe.userId, userId),
      exists(
        db.select({ title: recipe.title })
          .from(recipe)
          .where(and(
            eq(savedRecipe.recipeId, recipe.id),
            ilike(recipe.title, `%${query}%`)
          ))
      )
    ));
}

export async function getSavedMealsForPlanForm({ userId, query, limit, offset }: { userId: string; query: string; limit: number; offset: number; }) {
  return db.select({
    id: meal.id,
    title: meal.title,
    type: meal.type,
    calories: sql<number>`"meal_to_recipe_sub"."total_calories"`.as("total_calories"),
    recipes: sql<{
      id: string;
      title: string;
    }[]>`"meal_to_recipe_sub"."recipes"`.as("recipes")
  }).from(meal)
    .where(and(
      eq(meal.createdBy, userId),
      ilike(meal.title, `%${query}%`)
    ))
    .innerJoinLateral(
      db.select({
        calories: sql`sum("recipe_sub"."calories")`.as("total_calories"),
        recipes: sql`
          coalesce(
            json_agg("recipe_sub"."recipe"),
            '[]'::json
          )
        `.as("recipes")
      }).from(mealToRecipe)
        .where(eq(mealToRecipe.mealId, meal.id))
        .innerJoinLateral(
          db.select({
            calories: sql`"recipe_to_nutrition_sub"."calories"`.as("calories"),
            recipe: sql`
              json_build_object(
                'id', ${recipe.id},
                'title', ${recipe.title}
              )
            `.as("recipe")
          }).from(recipe)
            .where(eq(mealToRecipe.recipeId, recipe.id))
            .leftJoinLateral(
              db.select({
                calories: sql`coalesce(${recipeToNutrition.amount}, 0)`.as("calories")
              }).from(recipeToNutrition)
                .where(and(
                  eq(recipeToNutrition.recipeId, recipe.id),
                  eq(nutrition.name, "Calories")
                ))
                .innerJoin(nutrition, eq(recipeToNutrition.nutritionId, nutrition.id))
                .as("recipe_to_nutrition_sub"),
              sql`true`
            )
            .as("recipe_sub"),
          sql`true`
        )
        .as("meal_to_recipe_sub"),
      sql`true`
    )
    .limit(limit)
    .offset(offset);
}

export async function getSavedMealsForPlanFormCount({ userId, query }: { userId: string, query: string }) {
  return db.select({ count: count() })
    .from(meal)
    .where(and(
      eq(meal.createdBy, userId),
      ilike(meal.title, `%${query}%`)
    ));
}

