import { auth } from "@/auth";
import EditMealForm from "@/components/meals/edit/edit-meal-form";
import { db } from "@/db";
import { Metadata } from "next";
import { notFound, redirect, unauthorized } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Meal | Mealicious",
  description: "Edit your mealicious meals here!"
};

export default async function Page({ params }: PageProps<"/meals/[meal_id]/edit">) {
  const { meal_id: mealId } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/login");

  const foundMeal = await db.query.meal.findFirst({
    where: (meal, { eq }) => eq(meal.id, mealId),
    columns: {
      id: true,
      title: true,
      description: true,
      tags: true,
      createdBy: true
    },
    with: {
      includedRecipes: {
        with: {
          recipe: {
            columns: {
              id: true,
              title: true,
              description: true,
              image: true
            }
          }
        }
      }
    }
  });

  if (!foundMeal) notFound();
  if (foundMeal.createdBy !== userId) unauthorized();
  
  return <EditMealForm userId={userId} meal={foundMeal}/>;
}
