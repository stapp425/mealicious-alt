"use client";

import React, { ComponentProps, memo, useCallback, useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import defaultProfilePicture from "@/img/default/default-pfp.jpg";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Info, Loader2, Star, ThumbsUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn, getDateDifference } from "@/lib/utils";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteReview, getRecipeReviewCount, getRecipeReviewStatistics, getReviewsByRecipe, getUserReview, toggleReviewLike } from "@/lib/actions/recipe";
import Image from "next/image";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

type Review = {
  id: string;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
  rating: number;
  likeCount: number;
  creator: {
    image: string | null;
    id: string;
    email: string;
    name: string;
  };
  likedBy: {
    userId: string;
  }[];
};

const MAX_REVIEW_DISPLAY_LIMIT = 10;

export default function Reviews({
  recipeId,
  userId,
  className,
  ...props
}: Omit<ComponentProps<"section">, "children"> & {
  recipeId: string;
  userId: string;
}) {
  const { refresh } = useRouter();
  const queryClient = useQueryClient();

  const {
    isLoading: reviewCountLoading,
    data: reviewCount,
    error: reviewCountError
  } = useQuery({
    queryKey: ["recipe-reviews", recipeId, "review-count"],
    queryFn: () => getRecipeReviewCount(recipeId),
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  const {
    isLoading: reviewsLoading,
    isFetchingNextPage: reviewsNextPageLoading,
    data: reviews,
    error: reviewsError,
    fetchNextPage: loadMoreReviews
  } = useInfiniteQuery({
    queryKey: ["recipe-reviews", recipeId, "infinite-reviews"],
    initialPageParam: 0,
    getNextPageParam: (_lastPageData, _allPagesData, lastPageParam) => lastPageParam + 1,
    queryFn: ({ pageParam }: { pageParam: number }) => getReviewsByRecipe({
      recipeId,
      userId,
      limit: MAX_REVIEW_DISPLAY_LIMIT,
      offset: pageParam * MAX_REVIEW_DISPLAY_LIMIT
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes,
    refetchOnWindowFocus: false
  });

  const flatReviews = useMemo(
    () => reviews?.pages.flat(),
    [reviews?.pages]
  );

  const onDeleteReview = useCallback(async () => {
    await queryClient.invalidateQueries({
      predicate: ({ queryKey }) => 
        typeof queryKey[0] === "string" &&
        ["recipe-reviews", "recipe-statistics"].includes(queryKey[0]) &&
        queryKey[1] === recipeId
    });
    refresh();
  }, [queryClient, recipeId, refresh]);

  if (reviewCountError || reviewsError) {
    return (
      <section className="error-label flex items-center gap-2 p-2">
        There was an error while fetching review content.
      </section>
    );
  }

  if (reviewCountLoading || typeof reviewCount === "undefined" || reviewsLoading || !flatReviews) {
    return (
      <section className="@container pointer-events-none @min-4xl:col-span-2 flex flex-col gap-3">
        <Skeleton className="w-32 h-8 rounded-sm"/>
        {
          Array.from({ length: MAX_REVIEW_DISPLAY_LIMIT }, (_, i) => i).map((i) => (
            <Skeleton key={i} className="h-50 rounded-md"/>
          ))
        }
      </section>
    );
  }
  
  return (
    <section
      className={cn("@container flex flex-col gap-3", className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Info size={16} className="cursor-pointer"/>
          </PopoverTrigger>
          <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
            You can see what others think about this recipe here and optionally like reviews.
          </PopoverContent>
        </Popover>
        <h2 className="font-bold text-xl">Reviews</h2>
      </div>
      <UserReview
        recipeId={recipeId}
        userId={userId}
        onDeleteReview={onDeleteReview}
        className="@max-2xl:p-3"
      />
      <RecipeStatistics
        recipeId={recipeId}
        className="@min-3xl:flex-row"
      />
      {
        flatReviews.length > 0 ? flatReviews.map((r) => (
          <ReviewCard
            key={r.id}
            review={r}
            isReviewLiked={r.likedBy.length > 0}
            onDeleteReview={onDeleteReview}
            isAuthor={r.creator.id === userId}
            className="@max-2xl:p-3"
          />
        )) : (
          <h1 className="italic mx-auto text-muted-foreground">
            No written reviews yet...
          </h1>
        )
      }
      {
        reviewsNextPageLoading ? (
          <Loader2 className="animate-spin mx-auto"/>
        ) : (
          flatReviews.length < reviewCount && (
            <button
              onClick={() => loadMoreReviews()}
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

const RecipeStatistics = memo(({
  recipeId,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  recipeId: string;
}) => {
  const {
    data: statistics,
    isLoading: statisticsLoading,
    error: statisticsError
  } = useQuery({
    queryKey: ["recipe-reviews", recipeId, "statistics"],
    queryFn: () => getRecipeReviewStatistics(recipeId),
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  const statisticsObj = useMemo(() => [
    {
      rating: 5,
      count: statistics?.fiveStarCount || 0
    },
    {
      rating: 4,
      count: statistics?.fourStarCount || 0
    },
    {
      rating: 3,
      count: statistics?.threeStarCount || 0
    },
    {
      rating: 2,
      count: statistics?.twoStarCount || 0
    },
    {
      rating: 1,
      count: statistics?.oneStarCount || 0
    }
  ], [
    statistics?.fiveStarCount,
    statistics?.fourStarCount,
    statistics?.threeStarCount,
    statistics?.twoStarCount,
    statistics?.oneStarCount
  ]);

  if (statisticsError) {
    return (
      <div className="error-label flex items-center gap-2 p-2">
        <Info size={16}/>
        There was an error while fetching recipe statistics.
      </div>
    );
  }
  
  if (statisticsLoading || !statistics) {
    return (
      <div className="pointer-events-none h-42 flex flex-col @min-4xl:col-span-2 @min-3xl:flex-row justify-between items-stretch gap-3">
        <Skeleton className="min-w-38 flex-1 rounded-md"/>
        <div className="w-full @min-3xl:w-3/4 flex flex-col gap-3">
          {
            Array.from({ length: 5 }, (_, i) => i).map((i) => (
              <div key={i} className="h-6 flex items-center gap-2">
                <Skeleton className="h-full aspect-square rounded-sm"/>
                <Skeleton className="h-full aspect-square rounded-sm"/>
                <Skeleton className="h-full flex-1 rounded-sm"/>
                <Skeleton className="h-full aspect-square rounded-sm"/>
              </div>
            ))
          }
        </div>
      </div>
    );
  }
  
  const totalReviewCount = 
    statistics.fiveStarCount + 
    statistics.fourStarCount + 
    statistics.threeStarCount + 
    statistics.twoStarCount + 
    statistics.oneStarCount;
  
  return (
    <div 
      className={cn(
        "flex flex-col justify-between items-stretch gap-3",
        className
      )}
      {...props}
    >
      <div className="bg-mealicious-primary text-white min-w-38 flex-1 flex flex-col justify-center items-center gap-1.5 p-3 rounded-md">
        <span className="font-bold">Overall Rating</span>
        <div className="flex items-center gap-1">
          <b className="text-4xl">{statistics.overallRating.toFixed(1)}</b>
          <Star className="size-6 stroke-amber-400 fill-amber-400"/>
        </div>
        Total: {totalReviewCount}
      </div>
      <div className="w-full @min-3xl:w-3/4 flex flex-col gap-3">
        {
          statisticsObj.map(({ count, rating }) => (
            <div key={rating} className="flex items-center gap-2">
              <b>{rating}</b>
              <Star className="size-4 stroke-amber-400 fill-amber-400"/>
              <Progress value={Math.round(count / totalReviewCount * 100)}/>
              <b>{count}</b>
            </div>
          ))
        }
      </div>
    </div>
  );
});

RecipeStatistics.displayName = "RecipeStatistics";

const ReviewCard = memo(({
  review,
  isReviewLiked,
  isAuthor,
  onDeleteReview,
  onLikeToggle,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  review: Review;
  isReviewLiked: boolean;
  isAuthor: boolean;
  onDeleteReview?: () => void;
  onLikeToggle?: (review: Review, status: boolean) => void;
}) => {
  const [isLiked, setIsLiked] = useState(isReviewLiked);
  const [likeCount, setLikeCount] = useState(review.likeCount);
  const [open, setOpen] = useState(false);
  
  const {
    executeAsync: executeDeleteReview,
    isExecuting: isDeleteReviewExecuting
  } = useAction(deleteReview, {
    onSuccess: async ({ data }) => {
      setOpen(false);
      toast.warning(data.message);
      onDeleteReview?.();
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const {
    executeAsync: executeToggleLike,
    isExecuting: isExecuteToggleLikeExecuting
  } = useAction(toggleReviewLike, {
    onSuccess: ({ data }) => {
      setIsLiked(!!data.isLiked);
      setLikeCount(data.likeCount);
      onLikeToggle?.(review, data.isLiked);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });
  
  return (
    <div 
      className={cn(
        "dark:bg-sidebar border border-border flex flex-col gap-2 p-4 rounded-md",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="relative aspect-square size-12 rounded-full overflow-hidden">
          <Image 
            src={review.creator.image || defaultProfilePicture}
            alt={`Profile picture of ${review.creator}`}
            fill
            className="object-cover object-center bg-slate-100"
          />
        </div>
        <div className="flex flex-col items-start gap-1">
          <Link 
            href={`/user/${review.creator.id}`}
            className="cursor-pointer hover:underline font-bold"
          >
            {review.creator.name}
          </Link>
          <span className="text-muted-foreground text-sm">Mealicious User</span>
        </div>
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
                        <AlertDialogCancel className="cursor-pointer font-normal shadow-none rounded-sm">
                          Cancel
                        </AlertDialogCancel>
                        <Button
                          onClick={async () => await executeDeleteReview({ reviewId: review.id })}
                          disabled={isDeleteReviewExecuting}
                          className="min-w-19 cursor-pointer text-white bg-red-500 dark:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-400"
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
      <span className="text-muted-foreground text-xs">
        {format(review.createdAt, "MMM d, yyyy")} ({getDateDifference({ earlierDate: review.createdAt })} ago)
      </span>
      <div className="flex items-center gap-1.5">
        {
          Array.from({ length: 5 }, (_, i) => i + 1).map((i) => (
            <Star 
              key={`${i}-star`}
              className={cn(
                "size-5",
                i <= review.rating
                  ? "stroke-amber-400 fill-amber-400"
                  : "stroke-foreground fill-none"
              )}
            />
          ))
        }
      </div>
      <p className="mt-1.5 empty:hidden">
        {review.content}
      </p>
      {
        review.content && (
          <div className="h-5 flex items-center gap-2.5">
            {
              !isAuthor && (
                <>
                <button
                  disabled={isExecuteToggleLikeExecuting}
                  onClick={async () => await executeToggleLike({ reviewId: review.id })}
                  className="cursor-pointer disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {
                    isExecuteToggleLikeExecuting
                      ? <Loader2 
                          size={14}
                          className="animate-spin"
                        />
                      : <ThumbsUp
                          size={16}
                          className={cn(
                            "stroke-mealicious-primary",
                            isLiked ? "fill-mealicious-primary" : "fill-none"
                          )}
                        />
                  }
                </button>
                <Separator orientation="vertical"/>
                </>
              )
            }
            <span className="text-muted-foreground text-xs text-nowrap">{likeCount} {likeCount !== 1 ? "people" : "person"} liked this</span>
          </div>
        )
      }
    </div>
  );
});

ReviewCard.displayName = "Review Card";

const UserReview = memo(({
  recipeId,
  userId,
  ...props
}: Omit<ComponentProps<typeof ReviewCard>, "review" | "isReviewLiked" | "isAuthor"> & {
  recipeId: string;
  userId: string;
}) => {
  const { data: userReview } = useQuery({
    queryKey: ["recipe-reviews", recipeId, "user-recipe-review", userId],
    queryFn: () => getUserReview({
      recipeId,
      userId
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  if (!userReview) return null;

  return (
    <>
    <h2 className="font-bold text-xl">Your Review</h2>
    <ReviewCard 
      {...props}
      review={userReview}
      isReviewLiked={false}
      isAuthor
    />
    </>
  );
});

UserReview.displayName = "UserReview";
