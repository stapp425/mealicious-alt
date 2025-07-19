import { db } from "@/db";
import { recipe, recipeFavorite, savedRecipe } from "@/db/schema";
import { and, count, eq, exists, not } from "drizzle-orm";
import { ArrowDownToLine, Calendar, Heart, Pencil } from "lucide-react";
import { Metadata } from "next";
import { cache, Suspense } from "react";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import defaultProfilePicture from "@/img/default/default-pfp.svg";
import { Separator } from "@/components/ui/separator";
import CreatedRecipes from "@/components/user/main/created-recipes";
import SavedRecipes from "@/components/user/main/saved-recipes";
import FavoritedRecipes from "@/components/user/main/favorited-recipes";
import { CarouselSkeleton } from "@/components/user/main/user-info-carousel";
import { auth } from "@/auth";
import AboutSection from "@/components/user/main/about-section";

type PageProps = {
  params: Promise<{ user_id: string; }>;
};

const MAX_RECIPE_DISPLAY_LIMIT = 20;

export async function generateMetadata({ params }: { params: Promise<{ user_id: string; }> }): Promise<Metadata> {
  const { user_id: userId } = await params;
  const foundUser = await getUserDetails(userId);

  if (!foundUser?.user) {
    return {
      title: "Unknown User | Mealicious",
      description: "User data does not exist."
    };
  }

  const { 
    user: { name, image },
    counts
  } = foundUser;
  
  return {
    title: `${name} | Mealicious`,
    description: `${name}. Created Recipes: ${counts.created} • Favorited Recipes: ${counts.favorited} • Saved Recipes: ${counts.saved}`,
    openGraph: {
      type: "website",
      title: `${name} | Mealicious`,
      description: `${name}. Created Recipes: ${counts.created} • Favorited Recipes: ${counts.favorited} • Saved Recipes: ${counts.saved}`,
      images: image || defaultProfilePicture,
    }
  };
}

export default async function Page({ params }: PageProps) {
  const { user_id: userId } = await params;
  const foundUser = await getUserDetails(userId);

  const session = await auth();
  const sessionUserId = session?.user?.id;

  if (!foundUser.user) notFound();
  const { id, image, name, about, createdAt } = foundUser.user;
  const { created, favorited, saved } = foundUser.counts;

  return (
    <div className="flex-1 relative max-w-screen lg:max-w-[750px] overflow-x-hidden flex flex-col gap-3 mx-auto p-4">
      <section className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-8">
        <Avatar className="size-35">
          <AvatarImage 
            src={image || defaultProfilePicture}
            alt={`Profile picture of ${name}`}
          />
          <AvatarFallback className="bg-mealicious-primary text-white font-semibold text-5xl">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 grid gap-2">
          <h1 className="font-bold text-3xl">{name}</h1>
          <div className="flex text-muted-foreground items-center gap-2">
            <Calendar size={16}/>
            <h2 className="font-semibold text-muted-foreground">
              Joined on {format(createdAt, "MMMM do, yyyy")}
            </h2>
          </div>
          <div className="w-full sm:w-fit flex min-h-[50px] justify-between sm:justify-start items-start sm:items-center gap-3 sm:gap-5">
            <div className="flex-1 sm:flex-none sm:min-w-[50px] flex flex-col items-center gap-0.5">
              <div className="flex flex-col sm:flex-row items-center gap-1.5">
                <span className="font-bold text-2xl">{created.toLocaleString()}</span>
                <Pencil size={18}/>
              </div>
              <span className="text-center font-semibold">Created Recipes</span>
            </div>
            <Separator orientation="vertical"/>
            <div className="flex-1 sm:flex-none sm:min-w-[50px] flex flex-col items-center gap-0.5">
              <div className="flex flex-col sm:flex-row items-center gap-1.5">
                <span className="font-bold text-2xl">{saved.toLocaleString()}</span>
                <ArrowDownToLine size={18}/>
              </div>
              <span className="text-center font-semibold">Saved Recipes</span>
            </div>
            <Separator orientation="vertical"/>
            <div className="flex-1 sm:flex-none sm:min-w-[50px] flex flex-col items-center gap-0.5">
              <div className="flex flex-col sm:flex-row items-center gap-1.5">
                <span className="font-bold text-2xl">{favorited.toLocaleString()}</span>
                <Heart size={18} className="fill-foreground"/>
              </div>
              <span className="text-center font-semibold">Favorited Recipes</span>
            </div>
          </div>
        </div>
      </section>
      <AboutSection 
        isSessionUser={sessionUserId === id}
        about={about}
      />
      <Suspense fallback={<CarouselSkeleton />}>
        <CreatedRecipes
          userId={id}
          limit={MAX_RECIPE_DISPLAY_LIMIT}
        />
      </Suspense>
      <Suspense fallback={<CarouselSkeleton />}>
        <SavedRecipes
          userId={id}
          limit={MAX_RECIPE_DISPLAY_LIMIT}
        />
      </Suspense>
      <Suspense fallback={<CarouselSkeleton />}>
        <FavoritedRecipes
          userId={id}
          limit={MAX_RECIPE_DISPLAY_LIMIT}
        />
      </Suspense>
    </div>
  );
}

const getUserDetails = cache(async (userId: string) => {
  const userQuery = db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
    columns: {
      id: true,
      name: true,
      image: true,
      about: true,
      createdAt: true
    }
  });

  const createdRecipeCountQuery = db.select({ count: count() })
    .from(recipe)
    .where(and(
      eq(recipe.createdBy, userId),
      eq(recipe.isPublic, true)
    ));

  const favoritedRecipeCountQuery = db.select({ count: count() })
    .from(recipeFavorite)
    .where(eq(recipeFavorite.userId, userId));

  const savedRecipeCountQuery = db.select({ count: count() })
    .from(recipe)
    .where(and(
      not(eq(recipe.createdBy, userId)),
      eq(recipe.isPublic, true),
      exists(
        db.select()
          .from(savedRecipe)
          .where(and(
            eq(savedRecipe.recipeId, recipe.id),
            eq(savedRecipe.userId, userId)
          ))
      )
    ));

  const [
    user,
    [{ count: createdRecipeCount }],
    [{ count: favoritedRecipeCount }],
    [{ count: savedRecipeCount }]
  ] = await Promise.all([userQuery, createdRecipeCountQuery, favoritedRecipeCountQuery, savedRecipeCountQuery]);

  return {
    user,
    counts: {
      created: createdRecipeCount,
      favorited: favoritedRecipeCount,
      saved: savedRecipeCount
    }
  };
});
