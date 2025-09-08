import { auth } from "@/auth";
import CreatePlanForm from "@/components/plans/create/create-plan-form";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create Plan | Mealicious",
  description: "Create your mealicious plans here!"
};

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <CreatePlanForm userId={session.user.id}/>;
}
