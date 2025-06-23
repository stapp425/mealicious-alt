"use client";

import { toggleRecipeFavorite, toggleSavedListRecipe } from "@/lib/actions/db";
import { cn } from "@/lib/utils";
import { ArrowDownToLine, Heart, Loader2, X } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

type FavoriteProps = {
  recipeId: string;
  isRecipeFavorite: boolean;
  favoriteCount: number;
};

export function Favorite({ recipeId, isRecipeFavorite, favoriteCount }: FavoriteProps) {
  const [isFavorite, setIsFavorite] = useState<boolean>(isRecipeFavorite);
  const [_favoriteCount, _setFavoriteCount] = useState<number>(favoriteCount);
  const { executeAsync, isExecuting } = useAction(toggleRecipeFavorite, {
    onSuccess: ({ data }) => {
      setIsFavorite((f) => !f);
      _setFavoriteCount((c) => data?.isFavorite ? c + 1 : c - 1);
    },
    onError: () => toast.error(`Could not ${isFavorite ? "unfavorite" : "favorite"} recipe.`)
  });

  return (
    <button 
      disabled={isExecuting}
      onClick={async () => {
        await executeAsync({
          recipeId 
        });
      }}
      className="cursor-pointer disabled:bg-rose-300 bg-rose-400 hover:bg-rose-500 text-white text-xs sm:text-sm flex flex-col justify-center items-center py-2 md:py-3 rounded-sm transition-colors"
    >
      {
        isExecuting ? (
          <Loader2 size={24} className="animate-spin"/>
        ) : (
          <div className="w-full flex flex-col lg:flex-row justify-center items-center lg:gap-3">
            <Heart size={28} fill={isFavorite ? "white" : "none"}/>
            <div className="flex flex-col">
              <span className="font-semibold hidden md:block">{isFavorite ? "Unfavorite" : "Favorite"}</span>
              <span className="hidden md:block text-xs font-semibold">
                ({_favoriteCount} {_favoriteCount !== 1 ? "favorites" : "favorite"})
              </span>
              <span className="block md:hidden text-xs font-semibold">
                {_favoriteCount}
              </span>
            </div>
          </div>
        )
      }
    </button>
  );
}

type SavedProps = {
  recipeId: string;
  isRecipeSaved: boolean;
  isAuthor: boolean;
  savedCount: number;
};

export function Saved({ recipeId, isRecipeSaved, isAuthor, savedCount }: SavedProps) {
  const [isSaved, setIsSaved] = useState<boolean>(isRecipeSaved);
  const [_savedCount, _setSavedCount] = useState<number>(savedCount);
  const { executeAsync, isExecuting } = useAction(toggleSavedListRecipe, {
    onSuccess: ({ data }) => {
      setIsSaved((s) => !s);
      _setSavedCount((c) => data?.isSaved ? c + 1 : c - 1);
      if (data?.isSaved)
        toast.success("Successfully saved recipe!");
      else
        toast.warning("Successfully removed recipe from saved list!");
    },
    onError: () => toast.error(`Could not ${isSaved ? "remove" : "add"} recipe.`)
  });
  
  const label = isSaved ? "Unsave" : "Save";
  const Icon = isAuthor
    ? ArrowDownToLine
    : isSaved 
      ? X
      : ArrowDownToLine;
  
  return (
    <button 
      disabled={isExecuting || isAuthor}
      onClick={async () => {
        await executeAsync({ 
          recipeId
        });
      }}
      className={cn(
        "text-white text-xs sm:text-sm font-semibold flex flex-col lg:flex-row justify-center items-center lg:gap-4.5 py-2 md:py-3 rounded-sm transition-colors",
        isAuthor 
          ? "bg-green-500 gap-2"
          : isSaved
            ? "cursor-pointer disabled:cursor-not-allowed disabled:bg-red-300 bg-red-500 hover:bg-red-700"
            : "cursor-pointer disabled:cursor-not-allowed disabled:bg-green-300 bg-green-500 hover:bg-green-700"
      )}
    >
      {
        isExecuting ? (
          <Loader2 size={24} className="animate-spin"/>
        ) : (
          <>
          <Icon size={28}/>
          <div className="flex flex-col">
            {
              isAuthor ? (
                <>
                <span className="font-semibold hidden md:block">
                  {savedCount} {savedCount !== 1 ? "Saves" : "Save"}
                </span>
                <span className="font-semibold block md:hidden">
                  {savedCount}
                </span>
                </>
              ) : (
                <>
                <span className="font-semibold hidden md:block">
                  {label}
                </span>
                <span className="hidden md:block text-xs font-semibold">
                  ({_savedCount} {_savedCount !== 1 ? "saves" : "save"})
                </span>
                <span className="block md:hidden text-xs font-semibold">
                  {_savedCount}
                </span>
                </>
              )
            }
          </div>
          </>
        )
      }
    </button>
  );
}
