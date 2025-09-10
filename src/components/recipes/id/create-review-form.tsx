"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "@/lib/actions/recipe";
import { cn } from "@/lib/utils";
import { type CreateReviewForm, CreateReviewFormSchema, MAX_REVIEW_CONTENT_LENGTH } from "@/lib/zod/recipe";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Info, Loader2, Star } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import React, { ComponentProps, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

const ratingDescriptions = [
  {
    tag: "Terrible",
    className: "bg-red-700"
  }, {
    tag: "Needs Improvement",
    className: "bg-orange-600"
  }, 
  {
    tag: "Okay",
    className: "bg-yellow-500"
  }, 
  {
    tag: "Good",
    className: "bg-green-400"
  },
  {
    tag: "Excellent",
    className: "bg-green-500"
  }
];

export default function CreateReviewForm({
  recipeId,
  className,
  ...props
}: Omit<ComponentProps<"form">, "onSubmit"> & {
  recipeId: string;
}) {
  const { refresh } = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    register,
    setValue,
    handleSubmit,
    reset,
    formState: {
      isSubmitSuccessful,
      errors
    }
  } = useForm({
    resolver: zodResolver(CreateReviewFormSchema)
  });

  const { execute, isExecuting } = useAction(createReview, {
    onSuccess: async ({ data }) => {
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) => 
          queryKey[0] === "string" && 
          ["recipe-reviews", "recipe-statistics"].includes(queryKey[0]) &&
          queryKey[1] === recipeId
      });

      refresh();
      toast.success(data.message);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const [rating, currentContent] = useWatch({ control, name: ["rating", "content"] });
  const ratingDescription = ratingDescriptions[rating - 1];

  useEffect(() => {
    if (!isSubmitSuccessful) return;
    reset();
  }, [isSubmitSuccessful, reset]);

  return (
    <form 
      onSubmit={handleSubmit((data) => execute({ recipeId, review: data }))}
      className={cn("@container", className)}
      {...props}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <Popover>
          <PopoverTrigger asChild>
            <Info size={16} className="cursor-pointer"/>
          </PopoverTrigger>
          <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
            Create a review for the recipe here! If you add content to your review, others will be able to see and like it.
          </PopoverContent>
        </Popover>
        <h2 className="font-bold text-xl">Create a Review</h2>
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold required-field">Your Rating</h2>
        <p className="text-muted-foreground text-sm">
          You can rate the recipe to your own tastes here. Here are some adjectives that best describe each rating:
        </p>
        <ul className="flex flex-col gap-1">
          {
            ratingDescriptions.map((i, index) => (
              <li key={i.tag} className="text-muted-foreground text-xs list-inside list-disc">
                {index + 1} - {i.tag}
              </li>
            ))
          }
        </ul>
        <div className="flex flex-col items-start gap-4 my-2.5">
          <div className="flex items-center gap-2 h-9 @min-3xl:h-12">
            {
              Array.from({ length: 5 }, (_, i) => i + 1).map((i) => (
                <Star 
                  key={`${i}-star`}
                  onClick={() => setValue("rating", i)}
                  className={cn(
                    "cursor-pointer size-8 @min-3xl:size-14 transition-colors",
                    i <= rating
                      ? "stroke-amber-400 fill-amber-400"
                      : "stroke-foreground fill-none"
                  )}
                />
              ))
            }
          </div>
          {
            ratingDescription && (
              <div className="w-fit flex items-end gap-3 mb-1.25">
                <h1 className="font-extrabold text-4xl leading-6">
                  {rating.toFixed(1)}
                </h1>
                <span className={cn(
                  "font-semibold text-white text-xs py-1 px-2.5 rounded-full",
                  ratingDescription.className
                )}>
                  {ratingDescription.tag}
                </span>
              </div>
            )
          }
        </div>
        <h2 className="font-semibold">Rating Content</h2>
        <p className="text-muted-foreground text-sm">
          You can also write what you think about this recipe down below. (optional)
        </p>
        <Textarea
          placeholder="Review Content"
          {...register("content")}
          className="resize-none mt-2 rounded-sm shadow-none"
        />
        <span className={cn(
          "text-sm",
          currentContent && currentContent.length > MAX_REVIEW_CONTENT_LENGTH && "text-red-500"
        )}>
          <b className="text-base">{currentContent?.length || 0}</b> / {MAX_REVIEW_CONTENT_LENGTH}
        </span>
        <div className="error-label flex flex-col gap-2 mb-1.5 has-[>ul:empty]:hidden">
          <div className="flex items-center gap-2">
            <Info size={14}/>
            <span className="font-bold text-sm">Input Errors</span>
          </div>
          <Separator className="bg-primary/33 dark:bg-border"/>
          <ul className="flex flex-col gap-1">
            {
              Object.entries(errors).map(([field, { message }]) => (
                <li 
                  key={field}
                  className="text-xs list-inside list-disc"
                >
                  {message}
                </li>
              ))
            }
          </ul>
        </div>
        <div className="flex gap-6">
          <button
            type="submit"
            disabled={isExecuting}
            className="w-22 h-9 mealicious-button flex justify-center items-center font-semibold text-sm py-2 rounded-sm"
          >
            {isExecuting ? <Loader2 size={15} className="animate-spin"/> : "Submit"}
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="cursor-pointer underline font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
