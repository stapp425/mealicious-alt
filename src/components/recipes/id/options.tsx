"use client";

import { toggleRecipeFavorite, toggleSavedListRecipe } from "@/lib/actions/db";
import { cn } from "@/lib/utils";
import { Download, Heart, Loader2, Printer, X } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

type FavoriteProps = {
  recipeId: string;
  isRecipeFavorite: boolean;
};

export function Favorite({ recipeId, isRecipeFavorite }: FavoriteProps) {
  const [isFavorite, setIsFavorite] = useState<boolean>(isRecipeFavorite);
  const { executeAsync, isExecuting } = useAction(toggleRecipeFavorite, {
    onSuccess: () => setIsFavorite((f) => !f),
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
      className="cursor-pointer disabled:bg-rose-300 bg-rose-400 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold flex justify-center items-center gap-2 py-2 md:py-3 px-3 rounded-sm transition-colors"
    >
      {
        isExecuting ? (
          <Loader2 size={14} className="animate-spin"/>
        ) : (
          <>
          <Heart size={14} fill={isFavorite ? "white" : "none"}/>
          {isFavorite ? "Unfavorite" : "Favorite"}
          </>
        )
      }
    </button>
  );
}

type SavedProps = {
  recipeId: string;
  isRecipeSaved: boolean;
};

export function Saved({ recipeId, isRecipeSaved }: SavedProps) {
  const [isSaved, setIsSaved] = useState<boolean>(isRecipeSaved);
  const { executeAsync, isExecuting } = useAction(toggleSavedListRecipe, {
    onSuccess: ({ data }) => {
      setIsSaved((s) => !s);
      
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
        "cursor-pointer text-white text-xs sm:text-sm font-semibold flex justify-center items-center gap-2 py-2 md:py-3 px-3 rounded-sm transition-colors"
      )}
    >
      {
        isExecuting ? (
          <Loader2 size={14} className="animate-spin"/>
        ) : (
          <>
          <Icon size={14}/>
          {label}
          </>
        )
      }
    </button>
  );
}
