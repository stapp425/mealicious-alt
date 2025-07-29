"use client";

import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "@/lib/actions/recipe";
import { cn } from "@/lib/utils";
import { type CreateReviewForm, CreateReviewFormSchema } from "@/lib/zod/recipe";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type CreateReviewFormProps = {
  recipeId: string;
};

export default function CreateReviewForm({ recipeId }: CreateReviewFormProps) {
  const { refresh } = useRouter();
  const { executeAsync } = useAction(createReview, {
    onSuccess: ({ data }) => {
      if (!data) return;
      reset();
      refresh();
      toast.success("Successfully created review!");
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });
  const {
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: {
      isSubmitting,
      errors
    }
  } = useForm<CreateReviewForm>({
    resolver: zodResolver(CreateReviewFormSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    await executeAsync({ recipeId, review: data });
  });

  const rating = watch("rating");

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <h2 className="font-bold text-lg">Create a Review</h2>
      <Separator />
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">Your Rating</h2>
        {
          errors.rating?.message && (
            <div className="error-text text-sm">
              <Info size={16}/>
              {errors.rating?.message}
            </div>
          )
        }
      </div>
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2 h-[35px] md:h-[50px]">
          {
            Array.from({ length: 5 }, (_, i) => i + 1).map((i) => (
              <span 
                key={`${i}-star`}
                onClick={() => setValue("rating", i)}
                className={cn(
                  i <= rating ? "text-[#ffba00]" : "text-[var(--color-foreground)]",
                  "cursor-pointer text-3xl md:text-6xl"
                )}
              >
                {i <= rating ? '\u2605' : '\u2606'}
              </span>
            ))
          }
        </div>
        {
          errors.content?.message && (
            <div className="error-text text-sm">
              <Info size={16}/>
              {errors.content?.message}
            </div>
          )
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
          className="w-[85px] h-[35px] mealicious-button flex justify-center items-center font-semibold text-sm py-2 rounded-sm"
        >
          {isSubmitting ? <Loader2 size={15} className="animate-spin"/> : "Submit"}
        </button>
      </div>
    </form>
  );
}
