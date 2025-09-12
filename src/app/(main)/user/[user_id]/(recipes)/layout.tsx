import { db } from "@/db";
import { Metadata } from "next";
import { cache, Suspense } from "react";
import defaultProfilePicture from "@/img/default/default-pfp.jpg";
import { notFound } from "next/navigation";
import RecipesOptions from "@/components/user/recipes/recipes-options";
import RecipesSkeleton from "@/components/user/recipes/recipes-skeleton";

export async function generateMetadata({ params }: LayoutProps<"/user/[user_id]">): Promise<Metadata> {
  const { user_id: userId } = await params;
  const foundUser = await getUserDetails(userId);

  if (!foundUser) {
    return {
      title: "Unknown User | Mealicious",
      description: "User data does not exist."
    };
  }
  
  return {
    title: `${foundUser.name}'s Recipes | Mealicious`,
    description: `Check out ${foundUser.name}'s recipes here on Mealicious!`,
    openGraph: {
      type: "website",
      title: `${foundUser.name}'s Recipes | Mealicious`,
      description: `Check out ${foundUser.name}'s recipes here on Mealicious!`,
      images: foundUser.image || defaultProfilePicture.src
    }
  };
}

export default async function Layout({ params, children }: LayoutProps<"/user/[user_id]">) {
  const { user_id: userId } = await params;
  const foundUser = await getUserDetails(userId);
  if (!foundUser) notFound();
  
  return (
    <div className="max-w-250 w-full wrap-break-word flex-1 flex flex-col gap-2.5 mx-auto p-4">
      <h1 className="font-bold text-3xl hyphens-auto">{foundUser.name}&apos;s Recipes</h1>
      <RecipesOptions userId={userId}/>
      <Suspense fallback={<RecipesSkeleton />}>
        {children}
      </Suspense>
    </div>
  );
}

const getUserDetails = cache(async (userId: string) => {
  const user = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
    columns: {
      id: true,
      name: true,
      image: true
    }
  });

  return user;
});
