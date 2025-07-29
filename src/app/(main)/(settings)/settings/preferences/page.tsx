import { auth } from "@/auth";
import ChangeCuisinePreferencesForm from "@/components/settings/preferences/change-cuisine-preferences-form";
import ChangeDietPreferencesForm from "@/components/settings/preferences/change-diet-preferences-form";
import ChangeDishTypePreferencesForm from "@/components/settings/preferences/change-dish-type-preferences-form";
import ChangeNutritionPreferencesForm from "@/components/settings/preferences/change-nutrition-preferences-form";
import { db } from "@/db";
import { cuisine, diet, dishType, nutrition, user, userToCuisine, userToDiet, userToDishType, userToNutrition } from "@/db/schema";
import { Unit } from "@/lib/types";
import { asc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id: userId } = session.user;

  const nutritionPreferencesQuery = getUserNutritionPreferences(userId);
  const dietPreferencesQuery = getUserDietPreferences(userId);
  const dishTypePreferencesQuery = getUserDishTypePreferences(userId);
  const cuisinePreferencesQuery = getUserCuisinePreferences(userId);

  const [
    nutritionPreferences,
    dietPreferences,
    dishTypePreferences,
    cuisinePreferences
  ] = await Promise.all([
    nutritionPreferencesQuery,
    dietPreferencesQuery,
    dishTypePreferencesQuery,
    cuisinePreferencesQuery
  ]);
  
  return (
    <div className="grid gap-5">
      <ChangeNutritionPreferencesForm
        nutritionPreferences={nutritionPreferences}
      />
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

const getUserNutritionPreferences = cache(async (userId: string) => {
  const nutritionSubQuery = db.select({
    id: nutrition.id,
    name: nutrition.name,
    description: nutrition.description,
    allowedUnits: nutrition.allowedUnits,
    sortIndex: nutrition.sortIndex
  }).from(nutrition)
    .where(eq(userToNutrition.nutritionId, nutrition.id))
    .orderBy(asc(nutrition.sortIndex))
    .as("nutrition_sub");
  
  const userToNutritionSubQuery = db.select({
    data: sql`
      json_build_object(
        'id', ${nutritionSubQuery.id},
        'name', ${nutritionSubQuery.name},
        'description', ${nutritionSubQuery.description},
        'unit', ${userToNutrition.unit},
        'allowedUnits', ${nutritionSubQuery.allowedUnits},
        'amountLimit', ${userToNutrition.amountLimit}::integer
      )
    `.as("data")
  }).from(userToNutrition)
    .where(eq(userToNutrition.userId, user.id))
    .innerJoinLateral(
      nutritionSubQuery,
      sql`true`
    )
    .orderBy(asc(nutritionSubQuery.sortIndex))
    .as("user_to_nutrition_sub");

  const userNutritionQuery = db.select({
    preferredNutrition: sql<{
      id: string;
      name: string;
      description: string;
      unit: Unit["abbreviation"];
      allowedUnits: Unit["abbreviation"][];
      amountLimit: number;
    }[]>`coalesce(json_agg(${userToNutritionSubQuery.data}), '[]'::json)`
  }).from(user)
    .where(eq(user.id, userId))
    .innerJoinLateral(
      userToNutritionSubQuery,
      sql`true`
    )
    .groupBy(user.id);
  
  const defaultUserNutritionQuery = db.select({
    id: nutrition.id,
    name: nutrition.name,
    description: nutrition.description,
    allowedUnits: nutrition.allowedUnits
  }).from(nutrition)
    .orderBy(asc(nutrition.sortIndex));

  const [[userNutrition], defaultUserNutrition] = await Promise.all([userNutritionQuery, defaultUserNutritionQuery]);
  
  const userNutritionObject = userNutrition?.preferredNutrition.reduce((a, b) => {
    a[b.name] = {
      id: b.id,
      unit: b.unit,
      description: b.description,
      allowedUnits: b.allowedUnits,
      amountLimit: b.amountLimit
    };

    return a;
  }, {} as Record<string, {
    id: string;
    description: string;
    unit: Unit["abbreviation"];
    allowedUnits: Unit["abbreviation"][];
    amountLimit: number;
  }>) ?? {};

  const diffedUserNutrition = defaultUserNutrition.map((u) => {
    const matchingUserNutrition = userNutritionObject[u.name];
    return matchingUserNutrition ? {
      ...matchingUserNutrition,
      name: u.name
    } : {
      id: u.id,
      name: u.name,
      description: u.description,
      allowedUnits: u.allowedUnits,
      unit: u.allowedUnits[0],
      amountLimit: 0
    };
  });

  return diffedUserNutrition;
});

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

  const userDietsQuery = db.select({
    preferredDiets: sql<{
      id: string;
      name: string;
      description: string;
      score: number;
    }[]>`coalesce(json_agg(${userToDietSubQuery.data}), '[]'::json)`
  }).from(user)
    .where(eq(user.id, userId))
    .innerJoinLateral(userToDietSubQuery, sql`true`);

  const defaultUserDietsQuery = db.select({
    id: diet.id,
    name: diet.name,
    description: diet.description
  }).from(diet)
    .orderBy(asc(diet.name));

  const [[userDiets], defaultUserDiets] = await Promise.all([userDietsQuery, defaultUserDietsQuery]);

  const userDietsObject = userDiets?.preferredDiets.reduce((a, b) => {
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
  }>) ?? {};

  const diffedUserDiets = defaultUserDiets.map((u) => {
    const matchingUserDiet = userDietsObject[u.name];
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

  const userDishTypesQuery = db.select({
    preferredDishTypes: sql<{
      id: string;
      name: string;
      description: string;
      score: number;
    }[]>`coalesce(json_agg(${userToDishTypeSubQuery.data}), '[]'::json)`
  }).from(user)
    .where(eq(user.id, userId))
    .innerJoinLateral(userToDishTypeSubQuery, sql`true`);

  const defaultUserDishTypesQuery = db.select({
    id: dishType.id,
    name: dishType.name,
    description: dishType.description
  }).from(dishType)
    .orderBy(asc(dishType.name));

  const [[userDishTypes], defaultUserDishTypes] = await Promise.all([userDishTypesQuery, defaultUserDishTypesQuery]);

  const userDishTypesObject = userDishTypes?.preferredDishTypes.reduce((a, b) => {
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
  }>) ?? {};

  const diffedUserDishTypes = defaultUserDishTypes.map((u) => {
    const matchingUserDishType = userDishTypesObject[u.name];
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

  const [{ preferredCuisines }] = await db.select({
    preferredCuisines: sql<{
      id: string;
      icon: string;
      adjective: string;
      description: string;
      score: number;
    }[]>`coalesce(json_agg(${userToCuisineSubQuery.data}), '[]'::json)`
  }).from(user)
    .where(eq(user.id, userId))
    .innerJoinLateral(userToCuisineSubQuery, sql`true`);

  return preferredCuisines;
});
