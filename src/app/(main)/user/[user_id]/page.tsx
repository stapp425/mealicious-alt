import { db } from "@/db";
import { recipe, recipeFavorite, savedRecipe } from "@/db/schema";
import { and, count, eq, exists, not } from "drizzle-orm";
import { ArrowDownToLine, Calendar, Heart, Pencil } from "lucide-react";
import { Metadata } from "next";
import { cache, Suspense } from "react";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import defaultProfilePicture from "@/img/default/default-pfp.jpg";
import CreatedRecipes from "@/components/user/main/created-recipes";
import SavedRecipes from "@/components/user/main/saved-recipes";
import FavoritedRecipes from "@/components/user/main/favorited-recipes";
import { CarouselSkeleton } from "@/components/user/main/user-info-carousel";
import { auth } from "@/auth";
import AboutSection from "@/components/user/main/about-section";
import Image from "next/image";
import { CountSchema } from "@/lib/zod";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_RECIPE_DISPLAY_LIMIT = 20;

export async function generateMetadata({ params }: PageProps<"/user/[user_id]">): Promise<Metadata> {
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
      images: image || defaultProfilePicture.src,
    }
  };
}

export default async function Page({ params }: PageProps<"/user/[user_id]">) {
  const { user_id: userId } = await params;
  const foundUser = await getUserDetails(userId);

  const session = await auth();
  const sessionUserId = session?.user?.id;

  if (!foundUser.user) notFound();
  const { id, image, name, about, createdAt } = foundUser.user;
  const { created, favorited, saved } = foundUser.counts;

  const statistics = [
    {
      label: "Created Recipes",
      Icon: Pencil,
      amount: created
    },
    {
      label: "Saved Recipes",
      Icon: ArrowDownToLine,
      amount: saved
    },
    {
      label: "Favorited Recipes",
      Icon: Heart,
      amount: favorited
    }
  ];

  return (
    <div className="flex-1 relative w-full @min-4xl:max-w-250 overflow-x-hidden flex flex-col gap-6 mx-auto p-4">
      <section className="flex flex-col @min-2xl:flex-row justify-between items-center @min-2xl:items-stretch gap-6">
        <div className="relative size-36 @min-2xl:size-42 overflow-hidden">
          <Image 
            src={image || defaultProfilePicture}
            alt={`Profile picture of ${name}`}
            fill
            className="bg-slate-100 object-cover object-center rounded-full"
          />
        </div>
        <div className="w-full flex-1 flex flex-col items-center @min-2xl:items-start gap-1">
          <h1 className="font-bold text-3xl">{name}</h1>
          <span className="bg-mealicious-primary font-semibold text-white text-sm py-1.5 px-3 mb-0.75 rounded-sm">Mealicious User</span>
          <div className="w-fit text-muted-foreground text-sm flex items-center gap-2">
            <Calendar size={14}/>
            <h2 className="font-semibold">
              Joined on {format(createdAt, "MMMM do, yyyy")}
            </h2>
          </div>
          <div className="w-full @min-2xl:w-fit flex min-h-12 justify-between @min-2xl:justify-start items-start @min-2xl:items-center gap-10 @min-2xl:gap-12 mt-4 @min-2xl:mt-auto">
            {
              statistics.map(({ Icon, amount, label }) => (
                <div
                  key={label}
                  className={cn(
                    "flex-1 @min-2xl:flex-none @min-2xl:min-w-12 flex flex-col items-center gap-0.5"
                  )}
                >
                  <div className="flex items-center gap-1.5 @min-2xl:gap-2">
                    <Icon className="hidden @min-2xl:block size-4.5 @min-2xl:size-5.5"/>
                    <span className="font-bold text-2xl">{amount.toLocaleString()}</span>
                  </div>
                  <span className="font-semibold @min-2xl:font-normal text-sm text-muted-foreground text-center max-w-16 @min-lg:max-w-none">{label}</span>
                </div>
              ))
            }
          </div>
        </div>
      </section>
      <AboutSection 
        isSessionUser={sessionUserId === id}
        initialAboutContent={about}
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
    ))
    .then((val) => CountSchema.parse(val));

  const favoritedRecipeCountQuery = db.select({ count: count() })
    .from(recipeFavorite)
    .where(eq(recipeFavorite.userId, userId))
    .then((val) => CountSchema.parse(val));

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
    ))
    .then((val) => CountSchema.parse(val));

  const [
    user,
    createdRecipeCount,
    favoritedRecipeCount,
    savedRecipeCount
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
