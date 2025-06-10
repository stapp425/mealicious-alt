"use client";
import React, { memo, useState, useTransition } from "react";
import { Separator } from "@/components/ui/separator";
import { deleteReview, getReviewsByRecipe, toggleReviewLike } from "@/lib/actions/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import defaultProfilePicture from "@/img/default/default-pfp.svg";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Loader2, ThumbsUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MAX_REVIEW_DISPLAY_LIMIT, Review, Statistics } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ReviewsProps = {
  recipeId: string;
  userId: string;
  userReview?: Review;
  initialReviews: Review[];
  statistics: Statistics;
  reviewCount: number;
};

export default function Reviews({ recipeId, userId, initialReviews, userReview, statistics, reviewCount }: ReviewsProps) {
  const [isPending, startTransition] = useTransition();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  const loadReviews = () => startTransition(async () => {
    const fetchedReviews = await getReviewsByRecipe({
      recipeId,
      userId,
      limit: MAX_REVIEW_DISPLAY_LIMIT,
      offset: reviews.length
    });

    setReviews((r) => [...r, ...fetchedReviews]);
  });

  const totalReviewCount = 
    statistics.fiveStarCount + 
    statistics.fourStarCount + 
    statistics.threeStarCount + 
    statistics.twoStarCount + 
    statistics.oneStarCount;

  const overallRating = (
    statistics.fiveStarCount * 5 + 
    statistics.fourStarCount * 4 + 
    statistics.threeStarCount * 3 + 
    statistics.twoStarCount * 2 + 
    statistics.oneStarCount * 1
  ) / totalReviewCount || 0;
  
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-bold text-xl">Reviews</h2>
      <Separator />
      {
        userReview && (
          <>
          <h2 className="font-bold text-xl">Your Review</h2>
          <ReviewCard 
            review={userReview}
            setReviews={setReviews}
            isReviewLiked={userReview.likedBy.length > 0}
            isAuthor={userReview.creator.id === userId}
          />
          </>
        )
      }
      <div className="flex flex-col md:flex-row justify-between items-stretch gap-3">
        <div className="bg-mealicious-primary text-white min-w-[150px] flex-1 flex flex-col justify-center items-center gap-1.5 p-3 rounded-md">
          <span className="font-bold">Overall Rating</span>
          <div className="flex items-end gap-1">
            <b className="text-4xl">{overallRating.toFixed(1)}</b>
            <span className="text-[#ffba00] text-2xl">
              {'\u2605'}
            </span>
          </div>
          Total: {totalReviewCount}
        </div>
        <div className="w-full md:w-3/4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <b>5</b>
            <span className="text-[#ffba00]">
              {'\u2605'}
            </span>
            <Progress value={Math.round(statistics.fiveStarCount / totalReviewCount * 100)}/>
            <b>{statistics.fiveStarCount}</b>
          </div>
          <div className="flex items-center gap-2">
            <b>4</b>
            <span className="text-[#ffba00]">
              {'\u2605'}
            </span>
            <Progress value={Math.round(statistics.fourStarCount / totalReviewCount * 100)}/>
            <b>{statistics.fourStarCount}</b>
          </div>
          <div className="flex items-center gap-2">
            <b>3</b>
            <span className="text-[#ffba00]">
              {'\u2605'}
            </span>
            <Progress value={Math.round(statistics.threeStarCount / totalReviewCount * 100)}/>
            <b>{statistics.threeStarCount}</b>
          </div>
          <div className="flex items-center gap-2">
            <b>2</b>
            <span className="text-[#ffba00]">
              {'\u2605'}
            </span>
            <Progress value={Math.round(statistics.twoStarCount / totalReviewCount * 100)}/>
            <b>{statistics.twoStarCount}</b>
          </div>
          <div className="flex items-center gap-2">
            <b>1</b>
            <span className="text-[#ffba00]">
              {'\u2605'}
            </span>
            <Progress value={Math.round(statistics.oneStarCount / totalReviewCount * 100)}/>
            <b>{statistics.oneStarCount}</b>
          </div>
        </div>
      </div>
      {
        reviews.length > 0 ? reviews.map((r) => (
          <ReviewCard 
            key={r.id}
            review={r}
            isReviewLiked={r.likedBy.length > 0}
            setReviews={setReviews}
            isAuthor={r.creator.id === userId}
          />
        )) : (
          <h1 className="italic mx-auto text-muted-foreground">
            No written reviews yet...
          </h1>
        )
      }
      {
        isPending ? (
          <Loader2 className="animate-spin mx-auto"/>
        ) : (
          reviews.length < reviewCount && (
            <button
              onClick={() => loadReviews()}
              className="mealicious-button font-semibold text-sm mx-auto py-2 px-4 rounded-sm"
            >
              Load More Reviews
            </button>
          )
        )
      }
    </section>
  );
}

type ReviewCardProps = {
  review: Review;
  isReviewLiked: boolean;
  isAuthor: boolean;
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
};

const ReviewCard = memo(({ review, isReviewLiked, isAuthor, setReviews }: ReviewCardProps) => {
  const { refresh } = useRouter();
  const [isLiked, setIsLiked] = useState<boolean>(isReviewLiked);
  const [likeCount, setLikeCount] = useState<number>(review.likeCount);
  const [open, setOpen] = useState<boolean>(false);
  const { executeAsync: executeDeleteReview, isExecuting: isDeleteReviewExecuting } = useAction(deleteReview, {
    onSuccess: () => toast.warning("Successfully deleted review!"),
    onError: ({ error: { serverError } }) => toast.error(serverError || "Something went wrong.")
  });
  const { executeAsync: executeToggleLike, isExecuting: isExecuteToggleLikeExecuting } = useAction(toggleReviewLike, {
    onSuccess: ({ data }) => {
      setIsLiked((l) => !l);
      setLikeCount((c) => data?.isLiked ? c + 1 : c - 1);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError || "Something went wrong.")
  });
  
  return (
    <div className="bg-sidebar border border-border flex flex-col gap-2 p-3 rounded-md">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage 
            src={review.creator.image || defaultProfilePicture}
            alt={`Profile picture of ${review.creator}`}
          />
          <AvatarFallback>
            {review.creator.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <Link 
          href={`/user/${review.creator.id}`}
          className="font-bold"
        >
          {review.creator.name}
        </Link>
        {
          isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer ml-auto">
                <EllipsisVertical size={16}/>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogTrigger className="cursor-pointer w-full flex justify-between items-center text-sm p-1.5">
                      Remove
                      <Trash2 size={16} className="text-muted-foreground"/>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Deleting this review cannot be undone! You can always add a new review later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">
                          Cancel
                        </AlertDialogCancel>
                        <Button
                          onClick={async () => {
                            const deleteReviewResult = await executeDeleteReview({ reviewId: review.id });
                            
                            if (!deleteReviewResult?.data)
                              return;

                            setOpen(false);
                            setReviews((r) => [...r.filter((fr) => fr.id !== review.id)]);
                            refresh();
                          }}
                          disabled={isDeleteReviewExecuting}
                          className="min-w-[75px] cursor-pointer bg-red-500 dark:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-400 text-foreground"
                        >
                          {isDeleteReviewExecuting ? <Loader2 className="animate-spin"/> : "Continue"}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      </div>
      <div className="flex items-center gap-1.5">
        {
          Array.from({ length: 5 }, (_, i) => i + 1).map((i) => (
            <span 
              key={`${i}-star`}
              className={cn(
                i <= review.rating ? "text-[#ffba00]" : "text-[var(--color-foreground)]",
                "text-xl"
              )}
            >
              {i <= review.rating ? '\u2605' : '\u2606'}
            </span>
          ))
        }
      </div>
      {
        review.content && (
          <p className="text-muted-foreground">
            {review.content}
          </p>
        )
      }
      <div className="flex justify-between items-end gap-2">
        <button
          disabled={isAuthor || isExecuteToggleLikeExecuting}
          onClick={async () => await executeToggleLike({ reviewId: review.id })}
          className="mealicious-button w-[50px] h-[30px] font-semibold flex justify-center items-center gap-2 rounded-sm py-0.5 px-2.5"
        >
          {
            isExecuteToggleLikeExecuting ? (
              <Loader2 size={14} className="animate-spin"/>
            ) : (
              <>
              <ThumbsUp size={16} fill={isLiked ? "#FFFFFF" : "none"}/>
              {likeCount}
              </>
            )
          }
        </button>
        <span className="text-muted-foreground">{format(review.createdAt, "MMM d, yyyy")}</span>
      </div>
    </div>
  );
});

ReviewCard.displayName = "Review Card";
