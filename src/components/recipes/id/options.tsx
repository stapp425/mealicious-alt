"use client";

import { toggleRecipeFavorite, toggleSavedListRecipe } from "@/lib/actions/recipe";
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
  const { executeAsync, isExecuting, isTransitioning } = useAction(toggleRecipeFavorite, {
    onSuccess: ({ data }) => {
      setIsFavorite(data.isFavorite)
      queryClient.invalidateQueries({
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
      onClick={async () => await executeAsync(recipeId)}
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
  onRecipeSavedToggle,
  className,
  ...props
}: Omit<ComponentProps<"button">, "children" | "disabled" | "onClick"> & {
  recipeId: string;
  isRecipeSaved: boolean;
  onRecipeSavedToggle?: (status: boolean) => void;
}) {
  const queryClient = useQueryClient();
  
  const [isSaved, setIsSaved] = useState(isRecipeSaved);
  const { executeAsync, isExecuting, isTransitioning } = useAction(toggleSavedListRecipe, {
    onSuccess: ({ data }) => {
      setIsSaved(data.isSaved);
      queryClient.invalidateQueries({
        queryKey: ["recipe-statistics", recipeId]
      });
      queryClient.invalidateQueries({
        queryKey: ["meal-form-recipes"]
      });
      queryClient.invalidateQueries({
        queryKey: ["plan-form-calendar-plans"]
      });

      if (data.isSaved) toast.success("Successfully saved recipe!");
      else toast.warning("Successfully removed recipe from saved list!");

      onRecipeSavedToggle?.(data.isSaved);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const isActionExecuting = isExecuting || isTransitioning;
  const label = isSaved ? "Unsave" : "Save";
  const Icon = isSaved ? X : ArrowDownToLine;
  const savedStateClassName = isSaved
    ? "border-red-500 bg-red-300/15 disabled:bg-red-300/10 hover:bg-red-300/33 dark:hover:bg-red-300/50 dark:hover:bg-red-300/40 text-red-500"
    : "border-green-500 bg-green-300/15 disabled:bg-green-300/10 hover:bg-green-300/33 dark:hover:bg-green-300/40 text-green-500";
  
  return (
    <button 
      disabled={isActionExecuting}
      onClick={async () => await executeAsync(recipeId)}
      className={cn(
        "group/saved cursor-pointer disabled:cursor-not-allowed border text-xs",
        "flex flex-col justify-between items-center",
        "p-1.5 @min-3xl:p-2 rounded-sm transition-colors",
        isActionExecuting ? "justify-center" : "justify-center @min-3xl:justify-between",
        savedStateClassName,
        className
      )}
      {...props}
    >
      {
        isActionExecuting ? (
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
