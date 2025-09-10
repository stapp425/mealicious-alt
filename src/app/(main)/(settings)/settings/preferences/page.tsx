import { auth } from "@/auth";
import ChangeCuisinePreferencesForm from "@/components/settings/preferences/change-cuisine-preferences-form";
import ChangeDietPreferencesForm from "@/components/settings/preferences/change-diet-preferences-form";
import ChangeDishTypePreferencesForm from "@/components/settings/preferences/change-dish-type-preferences-form";
import { db } from "@/db";
import { cuisine, diet, dishType, user, userToCuisine, userToDiet, userToDishType } from "@/db/schema";
import { getCachedData } from "@/lib/actions/redis";
import { IdSchema, UrlSchema } from "@/lib/zod";
import { MAX_CUISINE_SCORE, MAX_DIET_SCORE, MAX_DISH_TYPE_SCORE } from "@/lib/zod/settings";
import { asc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import z from "zod/v4";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const dietPreferencesQuery = getUserDietPreferences(userId);
  const dishTypePreferencesQuery = getUserDishTypePreferences(userId);
  const cuisinePreferencesQuery = getUserCuisinePreferences(userId);

  const [
    dietPreferences,
    dishTypePreferences,
    cuisinePreferences
  ] = await Promise.all([
    dietPreferencesQuery,
    dishTypePreferencesQuery,
    cuisinePreferencesQuery
  ]);
  
  return (
    <div className="grid gap-5">
      <ChangeCuisinePreferencesForm
        cuisinePreferences={cuisinePreferences}
      />
      <ChangeDietPreferencesForm 
        dietPreferences={dietPreferences}
      />
      <ChangeDishTypePreferencesForm 
        dishTypePreferences={dishTypePreferences}
      />
    </div>
  );
}

const getUserDietPreferences = cache(async (userId: string) => {
  const dietSubQuery = db.select({ 
    id: diet.id,
    name: diet.name,
    description: diet.description
  }).from(diet)
    .where(eq(userToDiet.dietId, diet.id))
    .as("diet_sub");

  const userToDietSubQuery = db.select({
    data: sql`
      json_build_object(
        'id', ${dietSubQuery.id},
        'name', ${dietSubQuery.name},
        'description', ${dietSubQuery.description},
        'score', ${userToDiet.preferenceScore}
      )
    `.as("data")
  }).from(userToDiet)
    .where(eq(user.id, userToDiet.userId))
    .innerJoinLateral(dietSubQuery, sql`true`)
    .orderBy(asc(dietSubQuery.name))
    .as("user_to_diet_sub");

  const userDietsQuery = getCachedData({
    cacheKey: `user_${userId}_diet_preferences`,
    timeToLive: 60 * 5, // 5 minutes
    schema: z.array(
      z.object({
        preferredDiets: z.array(z.object({
          id: IdSchema,
          name: z.string().nonempty(),
          description: z.string().nonempty(),
          score: z.number()
            .nonnegative({ abort: true })
            .max(MAX_DIET_SCORE)
        }))
      })
    ).length(1).transform((val) => val[0].preferredDiets.reduce((a, b) => {
      a[b.name] = {
        id: b.id,
        name: b.name,
        description: b.description,
        score: b.score
      };

      return a;
    }, {} as Record<string, {
      id: string;
      name: string;
      description: string;
      score: number;
    }>)),
    call: () => db.select({
      preferredDiets: sql<{
        id: string;
        name: string;
        description: string;
        score: number;
      }[]>`coalesce(json_agg(${userToDietSubQuery.data}), '[]'::json)`
    }).from(user)
      .where(eq(user.id, userId))
      .innerJoinLateral(userToDietSubQuery, sql`true`)
  });

  const defaultUserDietsQuery = db.select({
    id: diet.id,
    name: diet.name,
    description: diet.description
  }).from(diet)
    .orderBy(asc(diet.name));

  const [userDiets, defaultUserDiets] = await Promise.all([
    userDietsQuery,
    defaultUserDietsQuery
  ]);

  const diffedUserDiets = defaultUserDiets.map((u) => {
    const matchingUserDiet = userDiets[u.name];
    return matchingUserDiet ? {
      ...matchingUserDiet,
      name: u.name
    } : {
      id: u.id,
      name: u.name,
      description: u.description,
      score: 0
    };
  });

  return diffedUserDiets;
});

const getUserDishTypePreferences = cache(async (userId: string) => {
  const dishTypeSubQuery = db.select({ 
    id: dishType.id,
    name: dishType.name,
    description: dishType.description
  }).from(dishType)
    .where(eq(userToDishType.dishTypeId, dishType.id))
    .as("dish_type_sub");

  const userToDishTypeSubQuery = db.select({
    data: sql`
      json_build_object(
        'id', ${dishTypeSubQuery.id},
        'name', ${dishTypeSubQuery.name},
        'description', ${dishTypeSubQuery.description},
        'score', ${userToDishType.preferenceScore}
      )
    `.as("data")
  }).from(userToDishType)
    .where(eq(user.id, userToDishType.userId))
    .innerJoinLateral(dishTypeSubQuery, sql`true`)
    .orderBy(asc(dishTypeSubQuery.name))
    .as("user_to_dish_type_sub");

  
  const userDishTypesQuery = getCachedData({
    cacheKey: `user_${userId}_dish_type_preferences`,
    timeToLive: 60 * 5, // 5 minutes
    schema: z.array(
      z.object({
        preferredDishTypes: z.array(z.object({
          id: IdSchema,
          name: z.string().nonempty(),
          description: z.string().nonempty(),
          score: z.number()
            .nonnegative({ abort: true })
            .max(MAX_DISH_TYPE_SCORE)
        }))
      })
    ).length(1).transform((val) => val[0].preferredDishTypes.reduce((a, b) => {
      a[b.name] = {
        id: b.id,
        name: b.name,
        description: b.description,
        score: b.score
      };

      return a;
    }, {} as Record<string, {
      id: string;
      name: string;
      description: string;
      score: number;
    }>)),
    call: () => db.select({
      preferredDishTypes: sql<{
        id: string;
        name: string;
        description: string;
        score: number;
      }[]>`coalesce(json_agg(${userToDishTypeSubQuery.data}), '[]'::json)`
    }).from(user)
      .where(eq(user.id, userId))
      .innerJoinLateral(userToDishTypeSubQuery, sql`true`)
  });

  const defaultUserDishTypesQuery = db.select({
    id: dishType.id,
    name: dishType.name,
    description: dishType.description
  }).from(dishType)
    .orderBy(asc(dishType.name));

  const [userDishTypes, defaultUserDishTypes] = await Promise.all([userDishTypesQuery, defaultUserDishTypesQuery]);

  const diffedUserDishTypes = defaultUserDishTypes.map((u) => {
    const matchingUserDishType = userDishTypes[u.name];
    return matchingUserDishType ? {
      ...matchingUserDishType,
      name: u.name
    } : {
      id: u.id,
      name: u.name,
      description: u.description,
      score: 0
    };
  });

  return diffedUserDishTypes;
});

const getUserCuisinePreferences = cache(async (userId: string) => {
  const cuisineSubQuery = db.select({
    id: cuisine.id,
    icon: cuisine.icon,
    adjective: cuisine.adjective,
    description: cuisine.description
  }).from(cuisine)
    .where(eq(userToCuisine.cuisineId, cuisine.id))
    .as("cuisine_sub");

  const userToCuisineSubQuery = db.select({
    data: sql`
      json_build_object(
        'id', ${cuisineSubQuery.id},
        'icon', ${cuisineSubQuery.icon},
        'adjective', ${cuisineSubQuery.adjective},
        'description', ${cuisineSubQuery.description},
        'score', ${userToCuisine.preferenceScore}::integer
      )
    `.as("data")
  }).from(userToCuisine)
    .where(eq(userToCuisine.userId, user.id))
    .innerJoinLateral(cuisineSubQuery, sql`true`)
    .orderBy(asc(cuisineSubQuery.adjective))
    .as("user_to_cuisine_sub");

  const preferredCuisines = await getCachedData({
    cacheKey: `user_${userId}_cuisine_preferences`,
    timeToLive: 60 * 5, // 5 minutes
    schema: z.array(
      z.object({
        preferredCuisines: z.array(z.object({
          id: IdSchema,
          icon: UrlSchema,
          adjective: z.string().nonempty(),
          description: z.string().nonempty(),
          score: z.number()
            .nonnegative()
            .max(MAX_CUISINE_SCORE)
        }))
      })
    ).length(1).transform((val) => val[0].preferredCuisines),
    call: () => db.select({
      preferredCuisines: sql<{
        id: string;
        icon: string;
        adjective: string;
        description: string;
        score: number;
      }[]>`coalesce(json_agg(${userToCuisineSubQuery.data}), '[]'::json)`
    }).from(user)
      .where(eq(user.id, userId))
      .innerJoinLateral(userToCuisineSubQuery, sql`true`)
  });

  return preferredCuisines;
});
