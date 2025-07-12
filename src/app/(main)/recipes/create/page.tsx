import CreateRecipeForm from "@/components/recipes/create/create-recipe-form";
import { db } from "@/db";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Recipe | Mealicious",
  description: "Create your mealicious recipes here!"
};

export default async function Page() {
  const cuisinesFetch = db.query.cuisine.findMany({
    orderBy: (cuisines, { asc }) => [asc(cuisines.adjective)],
    columns: {
      id: true,
      adjective: true,
      icon: true
    }
  });

  const nutritionFetch = db.query.nutrition.findMany({
    orderBy: (nutrition, { asc }) => [asc(nutrition.sortIndex)],
    columns: {
      description: false
    }
  });

  const dietsFetch = db.query.diet.findMany({
    columns: {
      description: false
    }
  });

  const dishTypesFetch = db.query.dishType.findMany({
    columns: {
      description: false
    }
  });

  const [cuisines, nutrition, diets, dishTypes] = await Promise.all([
    cuisinesFetch,
    nutritionFetch,
    dietsFetch,
    dishTypesFetch
  ]);
  
  return (
    <CreateRecipeForm
      cuisines={cuisines}
      nutrition={nutrition}
      diets={diets}
      dishTypes={dishTypes}
    />
  );
}