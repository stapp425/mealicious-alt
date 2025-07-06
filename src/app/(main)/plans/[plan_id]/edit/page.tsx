import { auth } from "@/auth";
import EditPlanForm from "@/components/plans/edit/edit-plan-form";
import EditPlanFormProvider from "@/components/plans/edit/edit-plan-form-provider";
import { db } from "@/db";
import { getDetailedPlansInTimeFrame } from "@/lib/actions/plan";
import { UTCDate } from "@date-fns/utc";
import { addMonths, startOfDay, startOfMonth } from "date-fns";
import { Metadata } from "next";
import { notFound, redirect, unauthorized } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Plan | Mealicious",
  description: "Edit your mealicious plans here!"
};

type PageProps = {
  params: Promise<{ plan_id: string }>;
};

const now = startOfDay(new Date());
const startDate = startOfMonth(now);
const endDate = addMonths(now, 1);

export default async function Page({ params }: PageProps) {
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

  const plans = await getDetailedPlansInTimeFrame({
    userId,
    startDate: new UTCDate(startDate),
    endDate: new UTCDate(endDate)
  });
  
  return (
    <EditPlanFormProvider
      userId={userId}
      startDate={startDate}
      endDate={endDate}
      plans={plans}
      planToEdit={foundDetailedPlan}
    >
      <EditPlanForm />
    </EditPlanFormProvider>
  );
}
