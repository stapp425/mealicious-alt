"use client";

import { toggleRecipeFavorite } from "@/lib/actions/db";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

type FavoriteToggleProps = {
  isRecipeFavorite: boolean; // starting state of toggle
};

export default function FavoriteToggle({ isRecipeFavorite }: FavoriteToggleProps) {
  const [isFavorite, setIsFavorite] = useState<boolean>();
  const { executeAsync, isExecuting } = useAction(toggleRecipeFavorite, {
    onError: () => {
      toast.error("Failed to change favorite state of recipe.");
    }
  });

  return (
    <div>
      
    </div>
  );
}