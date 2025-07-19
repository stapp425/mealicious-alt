import { auth } from "@/auth";
import { db } from "@/db";
import { notFound, unauthorized } from "next/navigation";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Clock, Microwave, Clipboard, Medal, Earth, Printer, Pencil } from "lucide-react";
import defaultImage from "@/img/default/default-background.jpg";
import defaultProfilePicture from "@/img/default/default-pfp.svg";
import { format } from "date-fns";
import Link from "next/link";
import Diets from "@/components/recipes/id/diets";
import DishTypes from "@/components/recipes/id/dish-types";
import Tags from "@/components/recipes/id/tags";
import Description from "@/components/recipes/id/description";
import Cuisine from "@/components/recipes/id/cuisine";
import Instructions from "@/components/recipes/id/instructions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Favorite, Saved } from "@/components/recipes/id/options";
import Ingredients from "@/components/recipes/id/ingredients";
import CookMode from "@/components/recipes/id/cook-mode";
import Nutrition from "@/components/recipes/id/nutrition";
import CreateReviewForm from "@/components/recipes/id/create-review-form";
import Reviews from "@/components/recipes/id/reviews";
import { MAX_REVIEW_DISPLAY_LIMIT } from "@/lib/types";
import { Metadata } from "next";
import { cache } from "react";
import { and, count, eq, isNotNull } from "drizzle-orm";
import { recipeReview } from "@/db/schema";
import { getReviewsByRecipe } from "@/lib/actions/recipe";

type MetadataProps = {
  params: Promise<{ recipe_id: string }>;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { recipe_id: id } = await params;
  const session = await getSession();
  const foundRecipe = await getRecipeDetails(id, session?.user?.id);

  if (!foundRecipe)
    notFound();

  const title = `${foundRecipe.title} | Mealicious`;
  const description = foundRecipe.description || "No description is available.";
  const image = foundRecipe.image;
  
  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: image
    }
  };
}

type PageProps = {
  params: Promise<{ recipe_id: string; }>;
};

export default async function Page({ params }: PageProps) {
  const session = await auth();
  const userId = session?.user?.id;
  const { recipe_id: recipeIdParam } = await params;
  const foundRecipe = await getRecipeDetails(recipeIdParam, userId);

  if (!foundRecipe)
    notFound();
  
  const isPublic = foundRecipe.isPublic;
  const isAuthor = foundRecipe.createdBy === userId;
  const isSaved = foundRecipe.savedBy && foundRecipe.savedBy.length > 0;
  const isFavorited = foundRecipe.favoritedBy && foundRecipe.favoritedBy.length > 0;
  const isAccessible = isAuthor || isPublic || isSaved;

  if (!isAccessible)
    unauthorized();

  const reviewCountQuery = db.select({ count: count() })
    .from(recipeReview)
    .where(and(
      eq(recipeReview.recipeId, foundRecipe.id),
      isNotNull(recipeReview.content)
    ));
  const recipeStatisticsQuery = db.query.recipeStatistics.findFirst({
    where: (stats, { eq }) => eq(stats.recipeId, foundRecipe.id)
  });
  const initialReviewsQuery = getReviewsByRecipe({
    recipeId: foundRecipe.id,
    userId: userId,
    limit: MAX_REVIEW_DISPLAY_LIMIT,
    offset: 0,
  });
  const userReviewQuery = db.query.recipeReview.findFirst({
    where: (review, { eq, and }) => and(
      eq(review.recipeId, foundRecipe.id),
      eq(review.userId, userId!)
    ),
    columns: {
      userId: false,
      recipeId: false
    },
    with: {
      creator: {
        columns: {
          id: true,
          image: true,
          name: true,
          email: true
        }
      },
      likedBy: {
        where: (liked, { eq }) => eq(liked.userId, userId || ""),
        columns: {
          userId: true
        }
      }
    }
  });
  
  const [
    initialReviews, 
    userReview, 
    reviewCount, 
    recipeStatistics
  ] = await Promise.all([
    initialReviewsQuery, 
    userReviewQuery, 
    reviewCountQuery, 
    recipeStatisticsQuery
  ]);

  return (
    <div className="flex-1 relative w-full">
      {
        isAccessible && (
          <Image 
            src={foundRecipe.image || defaultImage}
            alt={`Image of ${foundRecipe.title}`}
            fill
            priority
            className="object-cover contrast-35 dark:opacity-15"
          />
        )
      }
      <div className="relative bg-background flex flex-col gap-3 w-full min-h-full max-w-[750px] mx-auto p-4 shadow-2xl">
        <div className="wrap-break-word relative w-full h-[300px] sm:h-[400px]">
          <Image 
            src={foundRecipe.image || defaultImage}
            alt={`Image of ${foundRecipe.title}`}
            fill
            className="relative border border-border object-cover rounded-sm"
          />
          <h1 className="absolute bottom-3 left-3 right-3 w-fit max-w-full bg-background text-wrap word-wrap hyphens-auto line-clamp-2 font-bold text-xl text-foreground rounded-sm py-2 px-4 shadow-md">
            {foundRecipe.title}
          </h1>
          {
            (foundRecipe.sourceName && foundRecipe.sourceUrl) && (
              <Link 
                href={foundRecipe.sourceUrl}
                target="_blank"
                className="absolute top-3 left-3 right-3 max-w-[350px] w-fit bg-background hypens-none text-foreground font-semibold text-sm flex items-center gap-2 py-1.5 px-3 rounded-sm shadow-md"
              >
                <Earth size={16} className="shrink-0"/>
                <span className="truncate">{foundRecipe.sourceName}</span>
              </Link>
            )
          }
        </div>
        <section className="flex flex-col gap-3">
          <Description description={foundRecipe.description}/>
          <h1 className="font-bold text-xl">Author</h1>
          <div className="flex items-center gap-3">
            <Avatar className="size-[50px]">
              <AvatarImage
                src={foundRecipe.creator?.image || defaultProfilePicture}
                alt={`Profile picture of ${foundRecipe.creator?.name || "[deleted]"}`}
              />
              <AvatarFallback className="bg-mealicious-primary text-lg text-white font-semibold select-none">
                {foundRecipe.creator?.name.charAt(0).toUpperCase() || "D"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-between items-start">
              {
                foundRecipe.creator ? (
                  <Link href={`/user/${foundRecipe.creator.id}`} className="font-semibold hover:underline">
                    {foundRecipe.creator.name}
                  </Link>
                ) : (
                  <h2 className="text-muted-foreground italic">
                    [deleted]
                  </h2>
                )
              }
              <span className="italic text-muted-foreground text-sm">
                Created {format(foundRecipe.createdAt, "MMM d, yyyy")} {foundRecipe.updatedAt > foundRecipe.createdAt && `• Updated ${format(foundRecipe.updatedAt, "MMM d, yyyy")}`}
              </span>
            </div>
          </div>
          <div className="empty:hidden flex flex-col sm:flex-row flex-wrap items-start md:items-stretch gap-2">
            {
              isAuthor && (
                <div className="flex-1 w-full flex justify-center items-center gap-5 text-orange-400 border border-orange-400 text-sm font-semibold py-2 px-4 rounded-sm">
                  <Medal size={28}/>
                  <div className="flex flex-col items-start">
                    You created this recipe
                    <i className="text-xs">Last updated on {format(foundRecipe.updatedAt, "MMM d, yyyy")}</i>
                  </div>
                </div>
              )
            }
          </div>
        </section>
        <div className="flex justify-evenly items-stretch gap-3 *:flex-1">
          <Favorite 
            recipeId={foundRecipe.id}
            isRecipeFavorite={isFavorited}
            favoriteCount={recipeStatistics?.favoriteCount || 0}
          />
          <Saved 
            recipeId={foundRecipe.id}
            isRecipeSaved={isSaved}
            isAuthor={isAuthor}
            savedCount={recipeStatistics?.savedCount || 0}
          />
          <Link 
            href={`/recipes/${foundRecipe.id}/print`}
            target="_blank"
            className="cursor-pointer bg-slate-600 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold flex flex-col lg:flex-row justify-center items-center gap-2 lg:gap-3 py-2 md:py-3 rounded-sm transition-colors"
          >
            <Printer size={24}/>
            <span className="hidden md:block">Print</span>
          </Link>
          {
            isAuthor && (
              <Link 
                href={`/recipes/${foundRecipe.id}/edit`}
                className="mealicious-button text-xs sm:text-sm font-semibold flex flex-col lg:flex-row justify-center items-center gap-2 lg:gap-3 py-2 md:py-3 rounded-sm"
              >
                <Pencil size={24}/>
                <span className="hidden md:block">Edit</span>
              </Link>
            )
          }
        </div>
        <section className="bg-mealicious-primary text-white border border-border h-[100px] flex justify-between rounded-md">
          <div className="flex-1 flex flex-col justify-between items-center py-2">
            <Clock size={28}/>
            <h3>{Number(foundRecipe.prepTime)} min</h3>
            <h2 className="font-bold">Prep Time</h2>
          </div>
          <Separator orientation="vertical"/>
          <div className="flex-1 flex flex-col justify-between items-center py-2">
            <Microwave size={28}/>
            <h3>{Number(foundRecipe.cookTime)} min</h3>
            <h2 className="font-bold">Cook Time</h2>
          </div>
          <Separator orientation="vertical"/>
          <div className="flex-1 flex flex-col justify-between items-center py-2">
            <Clipboard size={28}/>
            <h3>{Number(foundRecipe.readyTime)} min</h3>
            <h2 className="font-bold">Ready Time</h2>
          </div>
        </section>
        {foundRecipe.cuisine && <Cuisine cuisine={foundRecipe.cuisine}/>}
        {foundRecipe.diets.length > 0 && <Diets diets={foundRecipe.diets.map(({ diet }) => diet)}/>}
        {foundRecipe.dishTypes.length > 0 && <DishTypes dishTypes={foundRecipe.dishTypes.map(({ dishType }) => dishType)} />}
        {foundRecipe.tags.length > 0 && <Tags tags={foundRecipe.tags} />}
        <Nutrition 
          servingSizeAmount={foundRecipe.servingSizeAmount}
          servingSizeUnit={foundRecipe.servingSizeUnit}
          nutritions={foundRecipe.nutritionalFacts}
        />
        <CookMode />
        <Ingredients ingredients={foundRecipe.ingredients}/>
        <Instructions instructions={foundRecipe.instructions}/>
        {!isAuthor && <CreateReviewForm recipeId={foundRecipe.id}/>}
        <Reviews
          reviewCount={reviewCount[0].count}
          initialReviews={initialReviews}
          userReview={userReview}
          statistics={recipeStatistics!}
          recipeId={foundRecipe.id}
          userId={userId!}
        />
      </div>
    </div>
  );
}

const getSession = cache(async () => await auth());
const getRecipeDetails = cache(async (recipeId: string, userId?: string) => {
  return await db.query.recipe.findFirst({
    where: (recipe, { eq }) => eq(recipe.id, recipeId),
    with: {
      creator: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      recipeStatistics: true,
      cuisine: {
        columns: {
          id: true,
          adjective: true,
          description: true,
          icon: true
        }
      },
      diets: {
        columns: {},
        with: {
          diet: true
        }
      },
      dishTypes: {
        columns: {},
        with: {
          dishType: true
        }
      },
      savedBy: userId ? {
        where: (savedBy, { eq }) => eq(savedBy.userId, userId),
        limit: 1,
        columns: {
          saveDate: true
        },
      } : undefined,
      favoritedBy: userId ? {
        where: (favoritedBy, { eq }) => eq(favoritedBy.userId, userId),
        limit: 1
      } : undefined,
      nutritionalFacts: {
        columns: {
          amount: true,
          unit: true
        },
        with: {
          nutrition: {
            columns: {
              allowedUnits: false
            }
          }
        }
      },
      ingredients: {
        columns: {
          recipeId: false
        }
      },
      instructions: {
        orderBy: (instruction, { asc }) => [asc(instruction.index)],
        columns: {
          recipeId: false
        }
      }
    }
  });
});
