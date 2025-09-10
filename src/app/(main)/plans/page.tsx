import { Metadata } from "next";
import PlanViews from "@/components/plans/calendar/plan-views";
import PlanCalendar from "@/components/plans/calendar/plan-calendar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MorePlans from "@/components/plans/calendar/more-plans";

export const metadata: Metadata = {
  title: "Plan Calendar | Mealicious",
  description: "Find your mealicious plans here!"
};

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  
  return (
    <div className="h-full w-full max-w-250 flex flex-col gap-3 mx-auto p-4 @min-2xl:p-6">
      <div className="flex flex-col @min-2xl:flex-row justify-between items-start @min-2xl:items-end gap-3 mb-2">
        <h1 className="font-bold text-4xl -mb-1">Plan Calendar</h1>
        <PlanViews />
      </div>
      <PlanCalendar userId={userId}/>
      <MorePlans />
    </div>
  );
}
