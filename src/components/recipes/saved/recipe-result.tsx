"use client";

import { Clock, Earth, EllipsisVertical, Flame, Heart, Loader2, Medal, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn, getDateDifference } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ComponentProps, memo, useCallback, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
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
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { deleteRecipe, toggleRecipeFavorite, toggleSavedListRecipe } from "@/lib/actions/recipe";
import { useQueryClient } from "@tanstack/react-query";

export default function RecipeResult({
  recipe,
  className,
  onClick,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  recipe: {
    id: string;
    title: string;
    description: string | null;
    image: string;
    calories: number;
    prepTime: number;
    diets: {
      id: string;
      name: string;
    }[];
    cuisine: {
      id: string;
      adjective: string;
      icon: string;
    } | null;
    sourceName: string | null;
    sourceUrl: string | null;
    saveDate: Date;
    isFavorite: boolean;
    isAuthor: boolean;
  };
}) {
  const { refresh, push } = useRouter();
  const [_isFavorite, _setIsFavorite] = useState(recipe.isFavorite);

  const onToggleFavorite = useCallback(
    (status: boolean) => _setIsFavorite(status),
    [_setIsFavorite]
  );

  return (
    <div 
      onClick={(e) => {
        push(`/recipes/${recipe.id}`);
        onClick?.(e);
      }}
      className={cn(
        "overflow-x-hidden cursor-pointer dark:bg-sidebar grid @min-3xl:grid-cols-[256px_1fr] gap-4 border border-border p-4 rounded-md transition-colors",
        className
      )}
      {...props}
    >
      <div className="shrink-0 group relative w-full h-64 min-h-48 @min-3xl:h-auto rounded-sm overflow-hidden">
        <Image 
          src={recipe.image}
          alt={`Image of ${recipe.title}`}
          fill
          className="block size-full object-cover object-center"
        />
        <div className="absolute size-full bg-linear-to-t from-gray-700/25 from-5% to-white/0 to-50%"/>
        {
          _isFavorite && (
            <div className="absolute bottom-2 left-2 flex justify-center items-center size-8 bg-rose-400 rounded-md">
              <Heart size={18} className="text-white"/>
            </div>
          )
        }
        {
          recipe.cuisine && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Image 
                  src={recipe.cuisine.icon}
                  alt={`Flag of ${recipe.cuisine.adjective} cuisine`}
                  width={30}
                  height={30}
                  className="absolute bottom-2 right-2 object-cover object-center rounded-full"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{recipe.cuisine.adjective}</p>
              </TooltipContent>
            </Tooltip>
          )
        }
      </div>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_2rem] items-start gap-3">
          <h2 className="flex-1 font-bold text-2xl hyphens-auto line-clamp-2 text-wrap">{recipe.title}</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer size-8 flex justify-center items-center rounded-full [&>svg]:size-5 hover:bg-muted">
                <EllipsisVertical />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end"
              className="w-36 bg-background"
              onClick={(e) => e.stopPropagation()} // this prevents the recipe result div container's click event from triggering
            >
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <FavoriteOption
                recipeId={recipe.id}
                isFavorite={_isFavorite}
                onToggleFavorite={onToggleFavorite}
              />
              <DropdownMenuSeparator />
              {
                recipe.isAuthor ? (
                  <>
                  <DropdownMenuItem asChild>
                    <Link 
                      href={`/recipes/${recipe.id}/edit`}
                      className="cursor-pointer"
                    >
                      Edit
                      <Pencil />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DeleteOption 
                    recipeId={recipe.id}
                    onDelete={refresh}
                  />
                  </>
                ) : (
                  <UnsaveOption 
                    recipeId={recipe.id}
                    onUnsave={refresh}
                  />
                )
              }
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {
          recipe.isAuthor && (
            <div className="flex items-center gap-2 text-orange-400 text-sm mb-1.25 font-semibold">
              <Medal size={16}/>
              You created this recipe
            </div>
          )
        }
        {
          recipe.diets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {
                recipe.diets.map((d) => (
                  <div key={d.id} className="bg-mealicious-primary text-white font-semibold text-xs px-3 py-1 rounded-full">
                    {d.name}
                  </div>
                ))
              }
            </div>
          )
        }
        <div className="flex items-center gap-3 h-6">
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <Flame size={14} className="fill-primary"/>
            <span>{Number(recipe.calories).toLocaleString()} Calories</span>
          </div>
          <Separator orientation="vertical"/>
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <Clock size={14}/>
            <span>{Math.floor(recipe.prepTime)} min</span>
          </div>
        </div>
        <div className="flex flex-col-reverse @min-3xl:flex-row justify-between items-start @min-3xl:items-end gap-2 mt-auto">
          <span className="text-muted-foreground text-sm">
            Saved {getDateDifference({ earlierDate: recipe.saveDate })} ago
          </span>
          {
            (recipe.sourceName && recipe.sourceUrl) && (
              <div className="flex flex-row-reverse @min-3xl:flex-row items-center gap-2">
                <a 
                  href={recipe.sourceUrl}
                  target="_blank"
                  className="text-sm hover:underline truncate max-w-72 @min-3xl:max-w-48"
                >
                  {recipe.sourceName}
                </a>
                <Earth size={16}/>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}

const FavoriteOption = memo(({
  recipeId,
  isFavorite,
  onToggleFavorite
}: { 
  recipeId: string;
  isFavorite: boolean;
  onToggleFavorite?: (status: boolean) => void;
}) => {
  const {
    execute: executeToggleFavorite,
    isExecuting: isToggleFavoriteExecuting
  } = useAction(toggleRecipeFavorite, {
    onSuccess: ({ data }) => onToggleFavorite?.(data.isFavorite),
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });
  
  return (
    <DropdownMenuItem
      disabled={isToggleFavoriteExecuting}
      onClick={() => executeToggleFavorite(recipeId)}
      onSelect={(e) => e.preventDefault()}
      className="cursor-pointer disabled:cursor-not-allowed"
    >
      {isFavorite ? "Unfavorite" : "Favorite"}
      {isToggleFavoriteExecuting ? <Loader2 className="animate-spin"/> : <Heart fill={isFavorite ? "var(--foreground)" : "none"}/>}
    </DropdownMenuItem>
  );
});

FavoriteOption.displayName = "FavoriteOption";

const DeleteOption = memo(({
  recipeId,
  onDelete
}: {
  recipeId: string;
  onDelete?: () => void;
}) => {
  const queryClient = useQueryClient();
  const {
    execute: executeDeleteRecipe,
    isExecuting: isDeleteRecipeExecuting
  } = useAction(deleteRecipe, {
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({
        queryKey: ["meal-form-recipes"]
      });
      queryClient.invalidateQueries({
        queryKey: ["plan-form-calendar-plans"]
      });
      toast.warning(data.message);
      onDelete?.();
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });
  
  return (
    <DropdownMenuItem 
      variant="destructive"
      asChild
    >
      <AlertDialog>
        <AlertDialogTrigger className="hover:bg-accent cursor-pointer w-full flex justify-between items-center text-sm px-2 py-1.5 rounded-sm">
          Delete
          <Trash2 size={16} className="text-muted-foreground"/>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this recipe is an irreversible action! Other users who have this recipe saved will not be able to access this recipe permanently!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <Button
              onClick={() => executeDeleteRecipe(recipeId)}
              disabled={isDeleteRecipeExecuting}
              variant="destructive"
              className="min-w-[75px] cursor-pointer"
            >
              {isDeleteRecipeExecuting ? <Loader2 className="animate-spin"/> : "Continue"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenuItem>
  );
});

DeleteOption.displayName = "DeleteOption";

const UnsaveOption = memo(({
  recipeId,
  onUnsave
}: {
  recipeId: string;
  onUnsave?: () => void;
}) => {
  const queryClient = useQueryClient();
  const {
    execute: executeToggleSaved,
    isExecuting: isToggleSavedExecuting
  } = useAction(toggleSavedListRecipe, {
    onSuccess: ({ data }) => {
      toast.warning(data.message);
      queryClient.invalidateQueries({
        queryKey: ["meal-form-recipes"]
      });
      queryClient.invalidateQueries({
        queryKey: ["plan-form-calendar-plans"]
      });
      onUnsave?.();
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });
  
  return (
    <AlertDialog>
      <AlertDialogTrigger className="hover:bg-accent cursor-pointer w-full flex justify-between items-center text-sm px-2 py-1.5 rounded-sm">
        Unsave
        <X size={16} className="text-muted-foreground"/>
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
          <AlertDialogCancel className="cursor-pointer font-normal rounded-sm shadow-none">
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={() => executeToggleSaved(recipeId)}
            disabled={isToggleSavedExecuting}
            variant="destructive"
            className="min-w-18 cursor-pointer rounded-sm shadow-none"
          >
            {isToggleSavedExecuting ? <Loader2 className="animate-spin"/> : "Continue"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

UnsaveOption.displayName = "UnsaveOption";
