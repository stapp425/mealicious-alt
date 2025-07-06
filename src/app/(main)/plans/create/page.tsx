import { auth } from "@/auth";
import CreatePlanForm from "@/components/plans/create/create-plan-form";
import CreatePlanFormProvider from "@/components/plans/create/create-plan-form-provider";
import { getDetailedPlansInTimeFrame } from "@/lib/actions/plan";
import { UTCDate } from "@date-fns/utc";
import { addMonths, startOfDay, startOfMonth } from "date-fns";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create Plan | Mealicious",
  description: "Create your mealicious plans here!"
};

const now = startOfDay(new Date());
const startDate = startOfMonth(now);
const endDate = addMonths(now, 1);

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const plans = await getDetailedPlansInTimeFrame({
    userId,
    startDate: new UTCDate(startDate),
    endDate: new UTCDate(endDate)
  });

  return (
    <CreatePlanFormProvider
      userId={userId}
      startDate={startDate}
      endDate={endDate}
      plans={plans}
    >
      <CreatePlanForm />
    </CreatePlanFormProvider>
  );
}
