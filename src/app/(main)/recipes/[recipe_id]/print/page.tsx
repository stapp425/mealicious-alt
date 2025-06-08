import { auth } from "@/auth";
import PrintRecipe from "@/components/recipes/print/print-recipe";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ recipe_id: string; }>;
};

export default async function Page({ params }: PageProps) {
  const { recipe_id: recipeIdParam } = await params;

  const foundRecipe = await db.query.recipe.findFirst({
    where: (recipe, { eq }) => eq(recipe.id, recipeIdParam),
    with: {
      creator: {
        columns: {
          id: true,
          name: true,
          image: true
        }
      },
      nutritionalFacts: {
        columns: {
          id: true,
          amount: true,
          unit: true
        },
        with: {
          nutrition: {
            columns: {
              id: true,
              name: true,
              isMacro: true
            }
          }
        }
      },
      ingredients: true,
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
  
  return (
    <div className="flex-1 bg-mealicious-primary-muted dark:bg-gray-900 w-full">
      <PrintRecipe recipe={foundRecipe}/>
    </div>
  );
}