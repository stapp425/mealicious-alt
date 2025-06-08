export const views = ["list", "grid"] as const;
export const sorts = ["none", "creator", "title", "favorited", "prep time", "save date"] as const;

export type View = typeof views[number];
export type Sort = typeof sorts[number];

export const recipeDetailViews = ["simplified", "detailed"] as const;

export type RecipeDetailView = typeof recipeDetailViews[number];
