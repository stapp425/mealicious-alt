import { db } from "@/db";
import { userRecipesView } from "@/lib/types";
import { createLoader, parseAsIndex, parseAsStringLiteral, SearchParams } from "nuqs/server";
import { cache, Suspense } from "react";
import defaultProfilePicture from "@/img/default/default-pfp.svg";
import { Metadata } from "next";
import CreatedRecipes from "@/components/user/recipes/created-recipes";
import RecipesOptions from "@/components/user/recipes/recipes-options";
import SavedRecipes from "@/components/user/recipes/saved-recipes";
import FavoritedRecipes from "@/components/user/recipes/favorited-recipes";
import { notFound } from "next/navigation";
import RecipesSkeleton from "@/components/user/recipes/recipes-skeleton";

type PageProps = {
  params: Promise<{ user_id: string; }>;
  searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
  recipesView: parseAsStringLiteral(userRecipesView)
    .withDefault("created")
    .withOptions({
      clearOnDefault: false
    }),
  page: parseAsIndex.withDefault(0)
}, {
  urlKeys: {
    recipesView: "option"
  }
});

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { user_id: userId } = await params;
  const foundUser = await getUserDetails(userId);
  const { recipesView } = await loadSearchParams(searchParams);

  if (!foundUser) {
    return {
      title: "Unknown User | Mealicious",
      description: "User data does not exist."
    };
  }

  const nickname = foundUser.nickname || foundUser.email.split("@")[0];
  
  return {
    title: `${nickname}'s Recipes | Mealicious`,
    description: `Check out ${nickname}'s ${recipesView} recipes here on Mealicious!`,
    openGraph: {
      type: "website",
      title: `${nickname}'s Recipes | Mealicious`,
      description: `Check out ${nickname}'s ${recipesView} recipes here on Mealicious!`,
      images: foundUser.image || defaultProfilePicture
    }
  };
}

const MAX_RECIPE_DISPLAY_LIMIT = 12;

export default async function Page({ params, searchParams }: PageProps) {
  const { user_id: userId } = await params;
  const { recipesView, page } = await loadSearchParams(searchParams);
  
  const foundUser = await getUserDetails(userId);
  if (!foundUser) notFound();
  const { nickname, email } = foundUser;
  
  return (
    <div className="max-w-[1000px] w-full flex-1 flex flex-col gap-2.5 mx-auto p-6">
      <h1 className="font-bold text-4xl">{nickname || email.split("@")[0]}&apos;s Recipes</h1>
      <RecipesOptions />
      <Suspense key={`${recipesView}-${page}`} fallback={<RecipesSkeleton />}>
        {
          recipesView === "created" && (
            <CreatedRecipes 
              userId={userId}
              limit={MAX_RECIPE_DISPLAY_LIMIT}
            />
          )
        }
        {
          recipesView === "saved" && (
            <SavedRecipes 
              userId={userId}
              limit={MAX_RECIPE_DISPLAY_LIMIT}
            />
          )
        }
        {
          recipesView === "favorited" && (
            <FavoritedRecipes
              userId={userId}
              limit={MAX_RECIPE_DISPLAY_LIMIT}
            />
          )
        }
      </Suspense>
    </div>
  );
}

const getUserDetails = cache(async (userId: string) => {
  const user = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
    columns: {
      id: true,
      email: true,
      nickname: true,
      image: true
    }
  });

  return user;
});
