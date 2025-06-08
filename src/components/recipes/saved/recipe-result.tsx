"use client";

import { Clock, Earth, EllipsisVertical, Heart, LoaderCircle, Medal, SquareArrowOutUpRight, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Link from "next/link";
import Image from "next/image";
import { getRecipeSaveDateDifference } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import defaultImage from "@/img/default/default-background.jpg";
import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toggleSavedListRecipe } from "@/lib/actions/db";
import { toast } from "sonner";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { views } from "@/lib/types";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

const MAX_DIET_DISPLAY_LIMIT = 4;

type RecipeResultProps = {
  recipe: {
    id: string;
    title: string;
    description: string | null;
    image: string | null;
    prepTime: string;
    diets: {
      id: string;
      name: string;
    }[] | null;
    cuisine: {
      adjective: string | null;
      countries: {
        id: string;
        icon: string;
      }[];
    } | null;
    sourceName: string | null;
    sourceUrl: string | null;
    saveDate: Date;
    isFavorite: boolean;
    isAuthor: boolean;
  };
};

export default function RecipeResult({ recipe }: RecipeResultProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [view] = useQueryState("view", parseAsStringLiteral(views).withDefault("list"));
  const router = useRouter();
  const { executeAsync, isExecuting } = useAction(toggleSavedListRecipe, {
    onSuccess: () => {
      setOpen(false);
      toast.warning("Recipe has been removed!");
      router.refresh();
    },
    onError: () => {
      toast.error("Failed to delete saved recipe.");
    }
  });

  const LayoutRecipeResult = view === "list" ? ListRecipeResult : GridRecipeResult;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <LayoutRecipeResult recipe={recipe} />
      </DialogTrigger>
      <DialogContent className="p-4 w-fit">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>
              {recipe.title}
            </DialogTitle>
            <DialogDescription>
              Provides basic information such as title, image, diets, and cuisine of {recipe.title}.
            </DialogDescription>
          </DialogHeader>
        </VisuallyHidden>
        <div className="w-[300px] flex flex-col gap-2">
          <div className="relative w-full h-[175px] sm:h-[225px]">
            <Image 
              src={recipe.image || defaultImage}
              alt={`Image of ${recipe.title}`}
              fill
              className="rounded-sm object-cover"
            />
          </div>
          <div className="flex justify-between items-start gap-5">
            <h2 className="font-bold text-lg hyphens-auto line-clamp-2 mt-0.5">{recipe.title}</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <EllipsisVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[150px] bg-background">
                <DropdownMenuLabel>Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link 
                    href={`/recipes/${recipe.id}`}
                    className="cursor-pointer"
                  >
                    View Details
                    <SquareArrowOutUpRight />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <AlertDialog>
                    <AlertDialogTrigger className="cursor-pointer w-full flex justify-between items-center text-sm p-1.5">
                      Remove
                      <Trash2 size={16} className="text-muted-foreground"/>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Removing this recipe from your saved list will be permanent. The recipe may be set to private, 
                          so you may not be able to add it back again in the future!
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => await executeAsync({ recipeId: recipe.id })}
                          disabled={isExecuting}
                          className="cursor-pointer bg-red-500 dark:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-400 text-foreground"
                        >
                          {isExecuting ? <LoaderCircle className="animate-spin"/> : "Continue"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {
            recipe.isAuthor && (
              <div className="flex items-center gap-2 text-orange-400 text-sm font-semibold">
                <Medal />
                You created this recipe
              </div>
            )
          }
          {
            (recipe.cuisine && recipe.cuisine.adjective && recipe.cuisine.countries.length > 0) && (
              <div className="border border-border flex items-center gap-3 rounded-md p-2">
                <Image 
                  src={recipe.cuisine.countries[0].icon}
                  alt={`Flag of ${recipe.cuisine.adjective} cuisine`}
                  width={35}
                  height={35}
                />
                <h3 className="font-semibold">{recipe.cuisine.adjective}</h3>
              </div>
            )
          }
          {
            recipe.diets && (
              <div className="flex flex-wrap items-center gap-2">
                {
                  recipe.diets.slice(0, MAX_DIET_DISPLAY_LIMIT).map((d) => (
                    <div key={d.id} className="bg-mealicious-primary text-white font-semibold text-xs px-3 py-1 rounded-full">
                      {d.name}
                    </div>
                  ))
                }
                {
                  recipe.diets.length > MAX_DIET_DISPLAY_LIMIT && (
                    <div className="bg-mealicious-primary-muted text-white font-semibold text-xs px-3 py-1 rounded-full">
                      ...
                    </div>
                  )
                }
              </div>
            )
          }
          <h2 className="font-bold text-lg">Description</h2>
          {
            recipe.description ? (
              <p className="text-muted-foreground text-sm hyphens-auto line-clamp-3">{recipe.description}</p>
            ) : (
              <p className="italic text-muted">No description is available.</p>
            )
          }
          {
            (recipe.sourceName && recipe.sourceUrl) && (
              <div className="flex items-end gap-3 truncate">
                <Link 
                  href={recipe.sourceUrl}
                  target="_blank"
                  className="underline"
                >
                  {recipe.sourceName}
                </Link>
                <Earth />
              </div>
            )
          }
          <i className="text-muted-foreground text-sm">
            {getRecipeSaveDateDifference(recipe.saveDate)}
          </i>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ListRecipeResult({ recipe, ...props }: RecipeResultProps & React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="cursor-pointer bg-sidebar flex flex-col sm:flex-row justify-between gap-4 border border-border p-4 rounded-md"
    >
      <div className="relative w-full sm:aspect-10/7 sm:w-[250px] h-[200px] md:h-auto max-h-[200px] sm:max-h-none">
        {
          recipe.image && (
            <Image 
              src={recipe.image}
              alt={`Image of ${recipe.title}`}
              fill
              className="block size-full rounded-sm object-cover"
            />
          )
        }
        {
          recipe.isFavorite && (
            <div className="absolute top-2 left-2 flex justify-center items-center size-8 bg-rose-400 rounded-md">
              <Heart size={18} className="text-white"/>
            </div>
          )
        }
      </div>
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex justify-between items-start gap-3">
          <h2 className="font-bold text-2xl line-clamp-2 text-wrap break-all truncate">{recipe.title}</h2>
          {
            (recipe.cuisine && recipe.cuisine.adjective && recipe.cuisine.countries.length > 0) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Image 
                    src={recipe.cuisine.countries[0].icon || defaultImage}
                    alt={`Flag of ${recipe.cuisine.adjective} cuisine`}
                    width={35}
                    height={35}
                    className="object-cover rounded-full"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{recipe.cuisine.adjective}</p>
                </TooltipContent>
              </Tooltip>
            )
          }
        </div>
        {
          recipe.isAuthor && (
             <div className="flex items-center gap-2 text-orange-400 text-sm font-semibold">
              <Medal />
              You created this recipe
            </div>
          )
        }
        {
          recipe.diets && (
            <div className="flex flex-wrap items-center gap-2">
              {
                recipe.diets.slice(0, MAX_DIET_DISPLAY_LIMIT).map((d) => (
                  <div key={d.id} className="bg-mealicious-primary text-white font-semibold text-xs px-3 py-1 rounded-full">
                    {d.name}
                  </div>
                ))
              }
              {
                recipe.diets.length > MAX_DIET_DISPLAY_LIMIT && (
                  <div className="bg-mealicious-primary-muted text-white font-semibold text-xs px-3 py-1 rounded-full">
                    ...
                  </div>
                )
              }
            </div>
          )
        }
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Clock size={14}/> {Math.floor(Number(recipe.prepTime))} min
        </div>
        <div className="flex flex-col-reverse lg:flex-row justify-between items-start lg:items-end gap-2 mt-auto">
          <i className="text-muted-foreground text-sm">
            {getRecipeSaveDateDifference(recipe.saveDate)}
          </i>
          {
            (recipe.sourceName && recipe.sourceUrl) && (
              <div className="flex flex-row-reverse lg:flex-row items-center gap-2 underline">
                <Link href={recipe.sourceUrl} target="_blank">
                  {recipe.sourceName}
                </Link>
                <Earth />
              </div>
            )
          }
        </div>
      </div>
    </button>
  );
}

function GridRecipeResult({ recipe, ...props }: RecipeResultProps & React.ComponentProps<"button">) {
  return (
    <button 
      {...props}
      className="cursor-pointer relative bg-sidebar border border-border flex flex-col gap-3 rounded-md p-4"
    >
      <div className="relative w-full h-[100px] sm:h-[175px]">
        {
          recipe.image && (
            <Image 
              src={recipe.image}
              alt={`Image of ${recipe.title}`}
              fill
              className="rounded-sm object-cover"
            />
          )
        }
        {
          recipe.isFavorite && (
            <div className="absolute top-2 left-2 flex justify-center items-center size-8 bg-rose-400 rounded-md">
              <Heart size={18} className="text-white"/>
            </div>
          )
        }
      </div>
      <div className="flex justify-between items-start gap-4">
        <h2 className="font-bold text-2xl line-clamp-1 text-wrap break-all truncate">{recipe.title}</h2>
        {
          (recipe.cuisine && recipe.cuisine.adjective && recipe.cuisine.countries) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Image 
                  src={recipe.cuisine.countries[0].icon || defaultImage}
                  alt={`Flag of ${recipe.cuisine.adjective} cuisine`}
                  width={35}
                  height={35}
                  className="object-cover rounded-full"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{recipe.cuisine.adjective}</p>
              </TooltipContent>
            </Tooltip>
          )
        }
      </div>
      {
        recipe.isAuthor && (
          <div className="flex text-left items-start sm:items-center gap-2 text-orange-400 text-sm font-semibold">
            <Medal />
            You created this recipe
          </div>
        )
      }
      <div className="flex items-center gap-2 font-semibold text-sm mt-auto">
        <Clock size={14}/>
        {Math.floor(Number(recipe.prepTime))} mins
      </div>
    </button>
  );
}
