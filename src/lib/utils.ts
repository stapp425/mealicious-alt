import { clsx, type ClassValue } from "clsx";
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInMonths, differenceInWeeks, differenceInYears } from "date-fns";
import { twMerge } from "tailwind-merge";
import { Rating } from "@/lib/types";

export const MAX_LIST_RECIPE_DISPLAY_LIMIT = 10;
export const MAX_GRID_RECIPE_DISPLAY_LIMIT = 12;
export const MAX_MEAL_DISPLAY_LIMIT = 10;
export const MAX_PLAN_DISPLAY_LIMIT = 5;
export const MAX_USER_RECIPE_DISPLAY_LIMIT = 12;

export const MAX_RECIPE_RESULT_DISPLAY_LIMIT = 4;
export const MAX_MEAL_RESULT_DISPLAY_LIMIT = 2;
export const MAX_CUISINE_RESULT_DISPLAY_LIMIT = 4;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// currentPage is zero-indexed
export function generatePagination(currentPage: number, totalPages: number): ("..." | number)[] {
  if (totalPages <= 1)
    return [1];
  
  if (totalPages <= 3)
    return Array.from({ length: totalPages }, (_, i) => i + 1);

  if (currentPage < 3)
    return [1, 2, 3, "...", totalPages];
  
  if (totalPages - currentPage < 3)
    return [1, "...", totalPages - 2, totalPages - 1, totalPages];

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export function remToPx(rem: number) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function getDateDifference({ earlierDate, laterDate = new Date() }: {
  earlierDate: Date;
  laterDate?: Date;
}): string {
  const differences = [
    {
      name: "year",
      pluralName: "years",
      difference: differenceInYears(laterDate, earlierDate)
    },
    {
      name: "month",
      pluralName: "months",
      difference: differenceInMonths(laterDate, earlierDate)
    },
    {
      name: "week",
      pluralName: "weeks",
      difference: differenceInWeeks(laterDate, earlierDate)
    },
    {
      name: "day",
      pluralName: "days",
      difference: differenceInDays(laterDate, earlierDate)
    },
    {
      name: "hour",
      pluralName: "hours",
      difference: differenceInHours(laterDate, earlierDate)
    },
    {
      name: "minute",
      pluralName: "minutes",
      difference: differenceInMinutes(laterDate, earlierDate)
    }
  ];

  const mostRecentTime = differences.find((d) => Math.floor(d.difference) > 0);

  if (!mostRecentTime)
    return "less than a minute";

  return `${mostRecentTime.difference} ${mostRecentTime.difference !== 1 ? mostRecentTime.pluralName : mostRecentTime.name}`;
}

export function getRatingKey(amount: number): Rating {
  let ratingKey: `${"one" | "two" | "three" | "four" | "five"}StarCount` = "oneStarCount";

  switch (amount) {
    case 1:
      ratingKey = "oneStarCount";
      break;
    case 2:
      ratingKey = "twoStarCount";
      break;
    case 3:
      ratingKey = "threeStarCount";
      break;
    case 4:
      ratingKey = "fourStarCount";
      break;
    case 5:
      ratingKey = "fiveStarCount";
      break;
  }

  return ratingKey;
}
