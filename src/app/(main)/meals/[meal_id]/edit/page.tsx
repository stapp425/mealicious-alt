import { auth } from "@/auth";
import EditMealForm from "@/components/meals/edit/edit-meal-form";
import { db } from "@/db";
import { Metadata } from "next";
import { notFound, redirect, unauthorized } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Meal | Mealicious",
  description: "Edit your mealicious meals here!"
};

type PageProps = {
  params: Promise<{ meal_id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { meal_id: mealId } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId)
    redirect("/login");

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
        columns: {},
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

  if (!foundMeal)
    notFound();
  
  if (foundMeal.createdBy !== userId)
    unauthorized();
  
  return (
    <EditMealForm
      userId={userId!}
      meal={foundMeal}
    />
  );
}
