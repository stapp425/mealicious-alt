import { auth } from "@/auth";
import CreateMealForm from "@/components/meals/create/create-meal-form";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create Meal | Mealicious",
  description: "Create your mealicious meals here!"
};

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  
  return <CreateMealForm userId={session.user.id}/>;
}
