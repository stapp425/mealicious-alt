import { auth } from "@/auth";
import RecipeCount, { RecipeCountSkeleton } from "@/components/dashboard/recipe-count";
import UpcomingPlan, { UpcomingPlanSkeleton } from "@/components/dashboard/upcoming-plan";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import defaultProfilePicture from "@/img/default/default-pfp.jpg";
import { Settings, UserRound } from "lucide-react";
import Link from "next/link";
import PopularRecipes, { PopularRecipesSkeleton } from "@/components/dashboard/popular-recipes";
import MostRecentSavedRecipes, { MostRecentSavedRecipesSkeleton } from "@/components/dashboard/most-recent-saved-recipes";
import Greeting from "@/components/dashboard/greeting";

export const metadata: Metadata = {
  title: "Dashboard | Mealicious",
  description: "View all things mealicious here!"
};

export default async function Page() {
  const session = await auth();
  const userInfo = {
    id: session?.user?.id,
    name: session?.user?.name,
    image: session?.user?.image
  };
  
  if (!userInfo.id || !userInfo.name || typeof userInfo.name === "undefined") redirect("/login");
  
  return (
    <div className="flex-1 w-full max-w-275 flex flex-col gap-6 @min-2xl:gap-8 mx-auto p-4">
      <div className="text-center @min-2xl:text-left flex flex-col @min-2xl:flex-row items-center @min-2xl:items-start gap-4 @min-2xl:gap-6">
        <div className="relative aspect-square size-36 mx-auto @min-2xl:mx-0 rounded-full overflow-hidden shrink-0">
          <Image 
            src={userInfo.image || defaultProfilePicture}
            alt={`Profile picture of ${userInfo.name}`}
            fill
            className="object-cover object-center bg-slate-100"
          />
        </div>
        <Greeting name={userInfo.name}/>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/user/${userInfo.id}`}
            className="dark:bg-sidebar border border-border size-12 font-semibold text-sm flex justify-center items-center gap-2.5 rounded-full transition-colors"
          >
            <UserRound size={24}/>
          </Link>
          <Link
            href="/settings/account"
            className="dark:bg-sidebar border border-border size-12 font-semibold text-sm flex justify-center items-center gap-2.5 rounded-full transition-colors"
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
