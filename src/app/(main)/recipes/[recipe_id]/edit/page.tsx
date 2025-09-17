import { auth } from "@/auth";
import EditRecipeForm from "@/components/recipes/edit/edit-recipe-form";
import { db } from "@/db";
import { Metadata } from "next";
import { notFound, unauthorized } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Recipe | Mealicious",
  description: "Edit your mealicious recipes here!"
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({ params }: PageProps<"/recipes/[recipe_id]/edit">) {
  const { recipe_id: recipeId } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  const foundRecipe = await db.query.recipe.findFirst({
    where: (recipe, { eq }) => eq(recipe.id, recipeId),
    columns: {
      createdAt: false, 
      cuisineId: false, 
      updatedAt: false
    },
    with: {
      cuisine: {
        columns: {
          id: true,
          adjective: true,
          icon: true
        }
      },
      diets: {
        columns: {},
        with: {
          diet: {
            columns: {
              id: true,
              name: true
            }
          }
        }
      },
      dishTypes: {
        columns: {},
        with: {
          dishType: {
            columns: {
              id: true,
              name: true
            }
          }
        }
      },
      nutritionalFacts: {
        columns: {
          amount: true,
          unit: true
        },
        with: {
          nutrition: {
            columns: {
              description: false
            }
          }
        }
      },
      ingredients: {
        columns: {
          recipeId: false
        }
      },
      instructions: {
        orderBy: (instruction, { asc }) => [asc(instruction.index)],
        columns: {
          recipeId: false
        }
      }
    }
  });

  if (!foundRecipe)
    notFound();

  if (foundRecipe.createdBy !== userId)
    unauthorized();

  const cuisinesQuery = db.query.cuisine.findMany({
    orderBy: (cuisines, { asc }) => [asc(cuisines.adjective)],
    columns: {
      id: true,
      adjective: true,
      icon: true
    }
  });

  const dietsQuery = db.query.diet.findMany({
    columns: {
      description: false
    }
  });

  const dishTypesQuery = db.query.dishType.findMany({
    columns: {
      description: false
    }
  });

  const nutritionQuery = db.query.nutrition.findMany({
    orderBy: (nutrition, { asc }) => [asc(nutrition.sortIndex)],
    columns: {
      description: false
    }
  });

  const [cuisines, diets, dishTypes, nutrition] = await Promise.all([cuisinesQuery, dietsQuery, dishTypesQuery, nutritionQuery]);
  
  return (
    <EditRecipeForm
      cuisines={cuisines}
      diets={diets}
      dishTypes={dishTypes}
      recipe={foundRecipe}
      nutrition={nutrition}
    />
  );
}