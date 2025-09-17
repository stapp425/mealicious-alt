import { auth } from "@/auth";
import { db } from "@/db";
import { notFound, unauthorized } from "next/navigation";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Clock, Microwave, Clipboard, Medal, Earth, Printer, Pencil, Info } from "lucide-react";
import defaultImage from "@/img/default/default-background.jpg";
import defaultProfilePicture from "@/img/default/default-pfp.jpg";
import { format } from "date-fns";
import Link from "next/link";
import Diets from "@/components/recipes/id/diets";
import DishTypes from "@/components/recipes/id/dish-types";
import Cuisine from "@/components/recipes/id/cuisine";
import { Favorite, Saved } from "@/components/recipes/id/options";
import CookMode from "@/components/recipes/id/cook-mode";
import CreateReviewForm from "@/components/recipes/id/create-review-form";
import { Metadata } from "next";
import { cache } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import RecipeInfo from "@/components/recipes/id/recipe-info";
import Reviews from "@/components/recipes/id/reviews";
import Statistics from "@/components/recipes/id/statistics";
import { revalidatePath } from "next/cache";

export async function generateMetadata({ params }: PageProps<"/recipes/[recipe_id]">): Promise<Metadata> {
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_NUTRIENT_PREVIEW_DISPLAY_LIMIT = 4;

export default async function Page({ params }: PageProps<"/recipes/[recipe_id]">) {
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

  const recipeTimes = [
    {
      icon: Clock,
      amount: foundRecipe.prepTime,
      label: "Prep Time"
    },
    {
      icon: Microwave,
      amount: foundRecipe.cookTime,
      label: "Cook Time"
    },
    {
      icon: Clipboard,
      amount: foundRecipe.readyTime,
      label: "Ready Time"
    }
  ];

  return (
    <div className="flex-1 relative w-full max-w-284 grid @min-4xl:grid-cols-2 p-4 gap-x-6 gap-y-10 mx-auto font-text">
      <div className="grid @min-4xl:grid-cols-subgrid @min-4xl:col-span-2 gap-6">
        <div className="relative min-h-96 wrap-break-word w-full">
          <Image 
            src={foundRecipe.image || defaultImage}
            alt={`Image of ${foundRecipe.title}`}
            fill
            className="border border-border object-cover object-center rounded-sm"
          />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="hyphens-auto line-clamp-3 text-4xl font-bold">
            {foundRecipe.title}
          </h1>
          <section className="flex items-center gap-3">
            <div className="relative size-12 rounded-full overflow-hidden">
              <Image 
                src={foundRecipe.creator?.image || defaultProfilePicture}
                alt={`Profile picture of ${foundRecipe.creator.name}`}
                fill
                className="object-cover object-center bg-slate-100"
              />
            </div>
            <div className="flex flex-col justify-between items-start gap-0.5">
              <Link href={`/user/${foundRecipe.creator.id}`} className="font-semibold hover:underline">
                {foundRecipe.creator.name}
              </Link>
              <span className="text-muted-foreground text-xs">
                Created {format(foundRecipe.createdAt, "MMM d, yyyy")} {foundRecipe.updatedAt > foundRecipe.createdAt && `• Updated ${format(foundRecipe.updatedAt, "MMM d, yyyy")}`}
              </span>
            </div>
          </section>
          <div className="flex flex-wrap gap-2 empty:hidden">
            {
              foundRecipe.tags.map((t) => (
                <Badge
                  key={t}
                  className="bg-mealicious-primary min-w-14 text-white px-3 rounded-full"
                >
                  {t}
                </Badge>
              ))
            }
          </div>
          <Statistics recipeId={foundRecipe.id}/>
          <div className="flex flex-col gap-3 mt-auto">
            {
              (foundRecipe.sourceName && foundRecipe.sourceUrl) && (
                <a 
                  href={foundRecipe.sourceUrl}
                  target="_blank"
                  className="group/source max-w-84 w-fit hypens-none font-semibold flex items-center gap-2"
                >
                  <Earth size={20} className="shrink-0"/>
                  <span className="mt-0.5 truncate text-sm group-hover/source:underline">{foundRecipe.sourceName}</span>
                </a>
              )
            }
            <div className="empty:hidden flex flex-col sm:flex-row flex-wrap items-start md:items-stretch gap-2">
              {
                isAuthor && (
                  <div className="flex-1 w-full flex justify-center items-center gap-5 text-orange-400 border border-orange-400 text-sm font-semibold py-2 px-4 rounded-sm">
                    <Medal size={28}/>
                    <div className="flex flex-col items-start">
                      <span className="text-sm">You created this recipe</span>
                      <span className="text-xs">Last updated on {format(foundRecipe.updatedAt, "MMM d, yyyy")}</span>
                    </div>
                  </div>
                )
              }
            </div>
            <div className="flex justify-evenly items-stretch gap-3 *:flex-1">
              <Favorite 
                recipeId={foundRecipe.id}
                isRecipeFavorite={isFavorited}
                onRecipeFavoriteToggle={async () => {
                  "use server";
                  revalidatePath("/recipes");
                  revalidatePath(`/recipes/${foundRecipe.id}`);
                }}
              />
              {
                !isAuthor && (
                  <Saved 
                    recipeId={foundRecipe.id}
                    isRecipeSaved={isSaved}
                    onSavedRecipeToggle={async () => {
                      "use server";
                      revalidatePath("/recipes");
                      revalidatePath(`/recipes/${foundRecipe.id}`);
                    }}
                  />
                )
              }
              <Link 
                href={`/recipes/${foundRecipe.id}/print`}
                target="_blank"
                className={cn(
                  "group/print cursor-pointer border border-slate-600 hover:border-slate-700 text-xs",
                  "bg-slate-600/15 disabled:bg-slate-600/10 hover:bg-slate-600/33 dark:hover:bg-slate-700/25",
                  "text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-600",
                  "flex flex-col justify-center @min-3xl:justify-between items-center",
                  "p-1.5 @min-3xl:p-2 rounded-sm transition-colors",
                )}
              >
                <Printer size={28}/>
                <span className="font-semibold hidden md:block">
                  Print
                </span>
              </Link>
              {
                isAuthor && (
                  <Link 
                    href={`/recipes/${foundRecipe.id}/edit`}
                    className={cn(
                      "group/edit cursor-pointer border border-orange-500 hover:border-orange-700 text-xs",
                      "bg-orange-500/15 disabled:bg-orange-500/10 hover:bg-orange-500/33 dark:hover:bg-orange-500/15",
                      "text-orange-600 hover:text-orange-700",
                      "flex flex-col justify-center @min-3xl:justify-between items-center",
                      "p-1.5 @min-3xl:p-2 rounded-sm transition-colors",
                    )}
                  >
                    <Pencil size={28}/>
                    <span className="font-semibold hidden md:block">
                      Edit
                    </span>
                  </Link>
                )
              }
            </div>
          </div>
        </div>
      </div>
      <div className="grid @min-4xl:grid-cols-subgrid @min-4xl:col-span-2 gap-x-6 gap-y-4">
        <div className="@min-4xl:col-span-2 flex flex-col gap-2 mb-2">
          <h1 className="font-bold text-3xl">
            Recipe Details
          </h1>
          <Separator className="w-28! h-1.5! bg-mealicious-primary"/>
        </div>
        <section className="@min-4xl:col-span-2 flex flex-col gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Info size={16} className="cursor-pointer"/>
              </PopoverTrigger>
              <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
                A brief summary of what the recipe is about and the origins behind it.
              </PopoverContent>
            </Popover>
            <h2 className="font-bold text-xl">Description</h2>
          </div>
          <p className={cn(
            "text-muted-foreground text-sm text-wrap hyphens-auto truncate",
            !foundRecipe.description && "italic"
          )}>
            {foundRecipe.description || "No description is available."}
          </p>
        </section>
        <div className="peer/details flex flex-col gap-3">
          { foundRecipe.cuisine && <Cuisine cuisine={foundRecipe.cuisine}/> }
          { foundRecipe.diets.length > 0 && <Diets diets={foundRecipe.diets.map(({ diet }) => diet)}/> }
          { foundRecipe.dishTypes.length > 0 && <DishTypes dishTypes={foundRecipe.dishTypes.map(({ dishType }) => dishType)}/> }
        </div>
        <div className="peer-empty/details:col-span-2 flex flex-col gap-3 @min-2xl:gap-7.5">
          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Info size={16} className="cursor-pointer"/>
                </PopoverTrigger>
                <PopoverContent className="text-xs font-semibold text-muted-foreground p-3 text-wrap hyphens-auto" align="start">
                  The amount of time it takes for the recipe to be made.
                </PopoverContent>
              </Popover>
              <h2 className="font-bold mt-0.5">Recipe Times</h2>
            </div>
            <div className="flex flex-col @min-md:flex-row justify-between gap-3">
              {
                recipeTimes.map((t) => (
                  <div
                    key={t.label}
                    className="bg-mealicious-primary text-white flex-1 flex flex-col items-center @min-2xl:items-start gap-1.5 p-3 rounded-sm"
                  >
                    <h2 className="font-bold text-sm @min-2xl:text-base text-center @min-2xl:text-left">{t.label}</h2>
                    <Separator />
                    <div className="w-full flex justify-center @min-2xl:justify-start items-center gap-4 @min-2xl:gap-2 mt-1">
                      <t.icon size={28}/>
                      <div className="text-sm flex flex-col @min-2xl:flex-row items-start @min-2xl:items-center @min-2xl:gap-1">
                        <h3 className="font-semibold">{t.amount}</h3>
                        <span className="font-light">minutes</span>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </section>
          <section className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Info size={16} className="cursor-pointer"/>
                </PopoverTrigger>
                <PopoverContent className="text-xs font-semibold text-muted-foreground p-3 text-wrap hyphens-auto" align="start">
                  The most important nutrients that are essential for the body to function properly.
                </PopoverContent>
              </Popover>
              <h2 className="font-bold mt-0.5">Macronutrients Information</h2>
            </div>
            <div className="dark:bg-sidebar border border-border w-full flex flex-col @min-md:flex-row justify-between rounded-sm">
              {
                foundRecipe.nutritionalFacts.map((n) => (
                  <div
                    key={n.nutrition.id}
                    className={cn(
                      "flex-1 flex flex-col justify-center p-2.5 gap-1.5",
                      "@min-md:not-last:border-r @min-md:not-last:border-r-border",
                      "@max-md:not-last:border-b @max-md:not-last:border-b-border"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Info size={16} className="cursor-pointer"/>
                        </PopoverTrigger>
                        <PopoverContent className="text-xs font-semibold text-muted-foreground p-3 text-wrap hyphens-auto" align="start">
                          {n.nutrition.description}
                        </PopoverContent>
                      </Popover>
                      <h3 className="text-center font-semibold text-xs @min-2xl:text-sm mt-0.5">{n.nutrition.name}</h3>
                    </div>
                    <span className="font-light">
                      <b className="font-bold text-base @min-2xl:text-xl">{n.amount}</b> {n.unit}
                    </span>
                  </div>
                ))
              }
            </div>
          </section>
          <CookMode className="dark:bg-sidebar mt-auto"/>
        </div>
        <RecipeInfo 
          recipeId={foundRecipe.id}
          servingSizeAmount={foundRecipe.servingSizeAmount}
          servingSizeUnit={foundRecipe.servingSizeUnit}
        />
      </div>
      <div className="grid @min-4xl:grid-cols-subgrid @min-4xl:col-span-2 gap-x-6 gap-y-4">
        <div className="@min-4xl:col-span-2 flex flex-col gap-2 mb-2">
          <h1 className="font-bold text-3xl">
            Reviews
          </h1>
          <Separator className="w-28! h-1.5! bg-mealicious-primary"/>
        </div>
        {
          !isAuthor && (
            <CreateReviewForm 
              recipeId={foundRecipe.id}
              className="@min-4xl:col-span-2 mb-4"
            />
          )
        }
        <Reviews
          recipeId={foundRecipe.id}
          userId={userId!}
          className="@min-4xl:col-span-2"
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
        },
        limit: MAX_NUTRIENT_PREVIEW_DISPLAY_LIMIT
      }
    }
  });
});
