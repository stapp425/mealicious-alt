import { auth } from "@/auth";
import RecipeCount, { RecipeCountSkeleton } from "@/components/dashboard/recipe-count";
import UpcomingPlan, { UpcomingPlanSkeleton } from "@/components/dashboard/upcoming-plan";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import defaultProfilePicture from "@/img/default/default-pfp.jpg";
import { format, getHours } from "date-fns";
import { Calendar, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import PopularRecipes, { PopularRecipesSkeleton } from "@/components/dashboard/popular-recipes";
import MostRecentSavedRecipes, { MostRecentSavedRecipesSkeleton } from "@/components/dashboard/most-recent-saved-recipes";

export const metadata: Metadata = {
  title: "Dashboard | Mealicious",
  description: "View all things mealicious here!"
};

function getGreeting(date: Date): string {
  const hour = getHours(date);
  if (hour < 12)
    return "Good morning";
  else if (hour < 17) 
    return "Good afternoon";
  else
    return "Good evening";
}

export default async function Page() {
  const now = new Date();
  const session = await auth();
  const userInfo = {
    id: session?.user?.id,
    name: session?.user?.name,
    image: session?.user?.image
  };
  
  if (!userInfo.id || !userInfo.name || typeof userInfo.name === "undefined") redirect("/login");
  
  return (
    <div className="flex-1 w-full max-w-[1500px] flex flex-col gap-4 sm:gap-8 mx-auto p-4">
      <div className="text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="relative aspect-square size-36 rounded-full overflow-hidden shrink-0">
          <Image 
            src={userInfo.image || defaultProfilePicture}
            alt={`Profile picture of ${userInfo.name}`}
            fill
            className="object-cover object-center bg-slate-100"
          />
        </div>
        <div className="flex-1 flex flex-col items-center sm:items-start gap-1">
          <h1 className="font-bold text-2xl sm:text-3xl">{getGreeting(now)}, {userInfo.name}!</h1>
          <span className="font-semibold text-muted-foreground text-lg">Welcome to Mealicious!</span>
          <div className="border border-border w-fit font-semibold text-sm flex items-center gap-2.5 rounded-full py-1.5 px-4">
            <Calendar size={18}/>
            {format(now, "MMMM do, yyyy")}
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/user/${userInfo.id}`}
            className="border border-border size-12 font-semibold text-sm flex justify-center items-center gap-2.5 rounded-full transition-colors"
          >
            <UserRound size={24}/>
          </Link>
          <Link
            href="/settings/account"
            className="border border-border size-12 font-semibold text-sm flex justify-center items-center gap-2.5 rounded-full transition-colors"
          >
            <Settings size={24}/>
          </Link>
        </div>
      </div>
      <Suspense fallback={<RecipeCountSkeleton />}>
        <RecipeCount userId={userInfo.id}/>
      </Suspense>
      <Suspense fallback={<PopularRecipesSkeleton />}>
        <PopularRecipes />
      </Suspense>
      <Suspense fallback={<UpcomingPlanSkeleton />}>
        <UpcomingPlan />
      </Suspense>
      <Suspense fallback={<MostRecentSavedRecipesSkeleton />}>
        <MostRecentSavedRecipes userId={userInfo.id}/>
      </Suspense>
    </div>
  );
}
