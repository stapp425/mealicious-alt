"use client";

import { toggleRecipeFavorite, toggleSavedListRecipe } from "@/lib/actions/db";
import { cn } from "@/lib/utils";
import { Download, Heart, Loader2, X } from "lucide-react";
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
      className="cursor-pointer disabled:bg-rose-300 bg-rose-400 hover:bg-rose-500 text-white text-xs sm:text-sm flex flex-col justify-center items-center py-2 md:py-3 px-3 rounded-sm transition-colors"
    >
      {
        isExecuting ? (
          <Loader2 size={14} className="animate-spin"/>
        ) : (
          <>
          <div className="font-semibold flex items-center gap-2">
            <Heart size={14} fill={isFavorite ? "white" : "none"}/>
            <span className="font-semibold">{isFavorite ? "Unfavorite" : "Favorite"}</span>
          </div>
          <span className="text-xs">({_favoriteCount} {_favoriteCount !== 1 ? "favorites" : "favorite"})</span>
          </>
        )
      }
    </button>
  );
}

type SavedProps = {
  recipeId: string;
  isRecipeSaved: boolean;
  savedCount: number;
};

export function Saved({ recipeId, isRecipeSaved, savedCount }: SavedProps) {
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

  const Icon = isSaved ? X : Download;
  const label = isSaved ? "Unsave" : "Save";
  
  return (
    <button 
      disabled={isExecuting}
      onClick={async () => {
        await executeAsync({ 
          recipeId
        });
      }}
      className={cn(
        isSaved ? "disabled:bg-red-300 bg-red-500 hover:bg-red-700 " : "disabled:bg-green-300 bg-green-500 hover:bg-green-700",
        "cursor-pointer text-white text-xs sm:text-sm font-semibold flex flex-col justify-center items-center py-2 md:py-3 px-3 rounded-sm transition-colors"
      )}
    >
      {
        isExecuting ? (
          <Loader2 size={14} className="animate-spin"/>
        ) : (
          <>
          <div className="flex items-center gap-2">
            <Icon size={14}/>
            {label}
          </div>
          <span className="text-xs">({_savedCount} {_savedCount !== 1 ? "saves" : "save"})</span>
          </>
        )
      }
    </button>
  );
}
