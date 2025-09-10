import { auth } from "@/auth";
import EditPlanForm from "@/components/plans/edit/edit-plan-form";
import { db } from "@/db";
import { getDetailedPlansInTimeFrame } from "@/lib/actions/plan";
import { Metadata } from "next";
import { notFound, redirect, unauthorized } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Plan | Mealicious",
  description: "Edit your mealicious plans here!"
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({ params }: PageProps<"/plans/[plan_id]/edit">) {
  const { plan_id: planId } = await params;
  
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [foundDetailedPlan] = await getDetailedPlansInTimeFrame({
    userId,
    planId
  });

  if (!foundDetailedPlan) notFound();

  const foundPlan = await db.query.plan.findFirst({
    where: (plan, { eq }) => eq(plan.createdBy, userId),
    columns: {
      createdBy: true
    }
  });
 
  if (foundPlan?.createdBy !== userId) unauthorized();
  
  return <EditPlanForm planToEdit={foundDetailedPlan} userId={userId}/>;
}
