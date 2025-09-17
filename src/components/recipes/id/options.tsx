"use client";

import { toggleRecipeFavorite, deleteRecipeFromSavedList, addRecipeToSavedList } from "@/lib/actions/recipe";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, Heart, Loader2, X } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { ComponentProps, useState } from "react";
import { toast } from "sonner";

export function Favorite({ 
  recipeId,
  isRecipeFavorite,
  onRecipeFavoriteToggle,
  className,
  ...props
}: Omit<ComponentProps<"button">, "children" | "disabled" | "onClick"> & {
  recipeId: string;
  isRecipeFavorite: boolean;
  onRecipeFavoriteToggle?: (status: boolean) => void;
}) {
  const queryClient = useQueryClient();
  
  const [isFavorite, setIsFavorite] = useState(isRecipeFavorite);
  const { execute, isExecuting, isTransitioning } = useAction(toggleRecipeFavorite, {
    onSuccess: async ({ data }) => {
      setIsFavorite(data.isFavorite)
      await queryClient.invalidateQueries({
        queryKey: ["recipe-statistics", recipeId]
      });
      onRecipeFavoriteToggle?.(data.isFavorite);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const isActionExecuting = isExecuting || isTransitioning;

  return (
    <button 
      disabled={isActionExecuting}
      onClick={() => execute(recipeId)}
      className={cn(
        "group/favorite cursor-pointer disabled:cursor-not-allowed border border-rose-400 hover:border-rose-500 text-xs",
        "bg-rose-400/15 disabled:bg-rose-400/10 hover:bg-rose-400/33 dark:hover:bg-rose-400/40",
        "text-rose-400 hover:text-rose-500",
        "flex flex-col items-center",
        isActionExecuting ? "justify-center" : "justify-center @min-3xl:justify-between",
        "p-1.5 @min-3xl:p-2 rounded-sm transition-colors",
        className
      )}
      {...props}
    >
      {
        isActionExecuting ? (
          <Loader2 size={28} className="animate-spin"/>
        ) : (
          <>
          <Heart 
            size={28}
            className={cn(isFavorite ? "fill-rose-400 group-hover/favorite:fill-rose-500" : "fill-none")}
          />
          <span className="font-semibold hidden @min-3xl:block">
            {isFavorite ? "Unfavorite" : "Favorite"}
          </span>
          </>
        )
      }
    </button>
  );
}

export function Saved({ 
  recipeId,
  isRecipeSaved,
  onSavedRecipeToggle,
  className,
  ...props
}: Omit<ComponentProps<"button">, "children" | "disabled" | "onClick"> & {
  recipeId: string ;
  isRecipeSaved: boolean;
  onSavedRecipeToggle?: (status: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    isSaved,
    isExecuting,
    toggleSaveFn
  } = useToggleSavedRecipe({
    initialSavedStatus: isRecipeSaved,
    onSavedRecipeToggleSuccess: async (val, message) => {
      if (val) toast.success(message);
      else toast.warning(message);

      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) => 
          queryKey[0] === "recipe-statistics" &&
          queryKey[1] === recipeId || 
          queryKey[0] === "meal-form-recipes"
      });
      onSavedRecipeToggle?.(val);
    },
    onSavedRecipeToggleError: (message) => toast.error(message)
  });

  const label = isSaved ? "Unsave" : "Save";
  const Icon = isSaved ? X : ArrowDownToLine;
  const savedStateClassName = isSaved
    ? "border-red-500 bg-red-300/15 disabled:bg-red-300/10 hover:bg-red-300/33 dark:hover:bg-red-300/50 dark:hover:bg-red-300/40 text-red-500"
    : "border-green-500 bg-green-300/15 disabled:bg-green-300/10 hover:bg-green-300/33 dark:hover:bg-green-300/40 text-green-500";
  
  return (
    <button 
      disabled={isExecuting}
      onClick={() => toggleSaveFn(recipeId)}
      className={cn(
        "group/saved cursor-pointer disabled:cursor-not-allowed border text-xs",
        "flex flex-col justify-between items-center",
        "p-1.5 @min-3xl:p-2 rounded-sm transition-colors",
        isExecuting ? "justify-center" : "justify-center @min-3xl:justify-between",
        savedStateClassName,
        className
      )}
      {...props}
    >
      {
        isExecuting ? (
          <Loader2 size={28} className="animate-spin"/>
        ) : (
          <>
          <Icon size={28}/>
          <span className="font-semibold hidden md:block">
            {label}
          </span>
          </>
        )
      }
    </button>
  );
}

function useToggleSavedRecipe({
  initialSavedStatus = false,
  onSavedRecipeToggleSuccess,
  onSavedRecipeToggleError
}: {
  initialSavedStatus?: boolean;
  onSavedRecipeToggleSuccess?: (val: boolean, message: string) => void;
  onSavedRecipeToggleError?: (message: string) => void;
}) {
  const [isSaved, setIsSaved] = useState(initialSavedStatus);

  const { 
    execute: executeAddRecipeToSavedList,
    isExecuting: isAddRecipeToSavedListExecuting,
    isTransitioning: isAddRecipeToSavedListTransitioning
  } = useAction(addRecipeToSavedList, {
    onSuccess: ({ data }) => {
      setIsSaved(true);
      onSavedRecipeToggleSuccess?.(true, data.message);
    },
    onError: ({ error: { serverError } }) => onSavedRecipeToggleError?.(serverError || "There was an internal server error.")
  });

  const { 
    execute: executeDeleteRecipeToSavedList,
    isExecuting: isDeleteRecipeToSavedListExecuting,
    isTransitioning: isDeleteRecipeToSavedListTransitioning
  } = useAction(deleteRecipeFromSavedList, {
    onSuccess: ({ data }) => {
      setIsSaved(false);
      onSavedRecipeToggleSuccess?.(false, data.message);
    },
    onError: ({ error: { serverError } }) => onSavedRecipeToggleError?.(serverError || "There was an internal server error.")
  });

  return {
    isSaved,
    toggleSaveFn: isSaved
      ? executeDeleteRecipeToSavedList
      : executeAddRecipeToSavedList,
    isExecuting: 
      isAddRecipeToSavedListExecuting || 
      isAddRecipeToSavedListTransitioning || 
      isDeleteRecipeToSavedListExecuting || 
      isDeleteRecipeToSavedListTransitioning
  };

}
