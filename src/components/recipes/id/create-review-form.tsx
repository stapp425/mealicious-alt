"use client";

import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "@/lib/actions/db";
import { cn } from "@/lib/utils";
import { ReviewCreation, ReviewCreationSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type CreateReviewFormProps = {
  recipeId: string;
};

const outlineStar = '\u2606';
const halfStar = '\u2BE8';
const filledStar = '\u2605';

export default function CreateReviewForm({ recipeId }: CreateReviewFormProps) {
  const router = useRouter();
  const { executeAsync } = useAction(createReview, {
    onSuccess: ({ data }) => toast.success(data?.message),
    onError: () => toast.error("Failed to create a review.")
  });
  const {
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: {
      isSubmitting
    }
  } = useForm<ReviewCreation>({
    resolver: zodResolver(ReviewCreationSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    const createReviewResult = await executeAsync({ recipeId, review: data });

    if (!createReviewResult?.data) {
      toast.error("Failed to create the review.");
      return;
    }
    
    router.refresh();
  });

  const rating = watch("rating");

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <h2 className="font-bold text-lg">Create a Review</h2>
      <Separator />
      <h2 className="font-semibold">Your Rating</h2>
      <div className="flex items-end gap-2 h-[50px]">
        {
          Array.from({ length: 5 }, (_, i) => i + 1).map((i) => (
            <span 
              key={`${i}-star`}
              onClick={() => setValue("rating", i)}
              className={cn(
                i <= rating ? "text-[#ffba00]" : "text-[var(--color-foreground)]",
                "cursor-pointer text-6xl"
              )}
            >
              {i <= rating ? '\u2605' : '\u2606'}
            </span>
          ))
        }
      </div>
      <Textarea
        placeholder="Write your review here (optional)"
        {...register("content")}
      />
      <div className="flex justify-end gap-6">
        <button
          type="button"
          onClick={() => reset()}
          className="cursor-pointer underline font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="mealicious-button font-semibold text-sm py-2 px-4 rounded-sm"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
