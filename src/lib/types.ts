export const MAX_REVIEW_DISPLAY_LIMIT = 1;

export const views = ["list", "grid"] as const;
export const sorts = ["none", "creator", "title", "favorited", "prep time", "save date"] as const;

export type View = typeof views[number];
export type Sort = typeof sorts[number];

export const recipeDetailViews = ["simplified", "detailed"] as const;

export type RecipeDetailView = typeof recipeDetailViews[number];

export type Review = {
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
  }[]
};

export type Statistics = {
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
};

export type Rating = `${"one" | "two" | "three" | "four" | "five"}StarCount`;
