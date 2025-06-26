export const MAX_REVIEW_DISPLAY_LIMIT = 5;

export const sorts = ["title", "calories", "prepTime", "saveDate"] as const;
export const filters = ["created", "favorited"] as const;

export type Sort = typeof sorts[number];
export type Filter = typeof filters[number];

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

export const units = [
  {
    name: "calorie",
    pluralName: "calories",
    abbreviation: "kcal"
  },
  {
    name: "gram",
    pluralName: "grams",
    abbreviation: "g"
  },
  {
    name: "milligram",
    pluralName: "milligrams",
    abbreviation: "mg"
  },
  {
    name: "microgram",
    pluralName: "micrograms",
    abbreviation: "μg"
  },
  {
    name: "percent",
    pluralName: "percent",
    abbreviation: "%"
  },
  {
    name: "milliliter",
    pluralName: "milliliters",
    abbreviation: "mL"
  },
  {
    name: "kilogram",
    pluralName: "kilograms",
    abbreviation: "kg"
  },
  {
    name: "pound",
    pluralName: "pounds",
    abbreviation: "lb"
  },
  {
    name: "ounce",
    pluralName: "ounces",
    abbreviation: "oz"
  },
  {
    name: "teaspoon",
    pluralName: "teaspoons",
    abbreviation: "tsp"
  },
  {
    name: "tablespoon",
    pluralName: "tablespoons",
    abbreviation: "tbsp"
  },
  {
    name: "cup",
    pluralName: "cups",
    abbreviation: "cup"
  },
  {
    name: "piece",
    pluralName: "pieces",
    abbreviation: "pc"
  },
  {
    name: "fluid ounce",
    pluralName: "fluid ounces",
    abbreviation: "fl oz"
  },
  {
    name: "pint",
    pluralName: "pints",
    abbreviation: "pt"
  },
  {
    name: "quart",
    pluralName: "quarts",
    abbreviation: "qt"
  },
  {
    name: "gallon",
    pluralName: "gallons",
    abbreviation: "gal"
  },
  {
    name: "liter",
    pluralName: "liters",
    abbreviation: "L"
  }
] as const;

export type Unit = typeof units[number];

export const unitNames = units.map((u) => u.name);
export const unitPluralNames = units.map((u) => u.pluralName);
export const unitAbbreviations = units.map((u) => u.abbreviation);

export const mealTypes = ["breakfast", "brunch", "lunch", "dinner", "supper", "snack"] as const;
export type MealType = typeof mealTypes[number];
