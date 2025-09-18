import { sql, relations } from "drizzle-orm";
import { pgTable, check, unique, primaryKey } from "drizzle-orm/pg-core";
import { user, userToCuisine, userToDiet, userToDishType } from "./user";
import { mealToRecipe } from "./meal";
import { Unit } from "@/lib/types";
import { nanoid } from "nanoid";

export const recipe = pgTable("recipe", (t) => ({
  id: t.text("recipe_id")
    .primaryKey()
    .$default(nanoid),
  title: t.varchar("recipe_title", { length: 100 }).notNull(),
  image: t.text("recipe_image")
    .notNull()
    .default(`${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL!}/mealicious-logo.jpg`),
  description: t.text("recipe_desc"),
  tags: t.json("recipe_tags")
    .$type<string[]>()
    .notNull()
    .default([]),
  sourceName: t.varchar("recipe_source_name", { length: 256 }),
  sourceUrl: t.varchar("recipe_source_url", { length: 2048 }),
  cookTime: t.integer("recipe_cook_time")
    .notNull()
    .default(0),
  prepTime: t.integer("recipe_prep_time")
    .notNull()
    .default(0),
  readyTime: t.integer("recipe_ready_time")
    .notNull()
    .default(0),
  servingSizeUnit: t.text("recipe_serving_size_unit")
    .notNull()
    .$type<Unit["abbreviation"]>(),
  servingSizeAmount: t.numeric("recipe_serving_size_amount", {
    mode: "number",
    precision: 6,
    scale: 2
  }).notNull(),
  createdBy: t.text("recipe_created_by")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade"
    }),
  cuisineId: t.text("recipe_cuisine").references(() => cuisine.id, {
    onDelete: "set null"
  }),
  isPublic: t.boolean("recipe_is_public").notNull().default(false),
  createdAt: t.timestamp("recipe_created_at", {
    precision: 0,
    withTimezone: true
  }).notNull()
    .defaultNow(),
  updatedAt: t.timestamp("recipe_updated_at", {
    precision: 0,
    withTimezone: true
  }).notNull()
    .defaultNow()
}), (t) => [
  check(
    "recipe_time_check",
    sql`${t.cookTime} >= 0 AND ${t.prepTime} >= 0 AND ${t.readyTime} >= 0`
  )
]);

export const recipeStatistics = pgTable("recipe_stats", (t) => ({
  recipeId: t.text("recipe_id")
    .primaryKey()
    .references(() => recipe.id, {
      onDelete: "cascade"
    }),
  savedCount: t.integer("r_stat_saved_count")
    .notNull()
    .default(0),
  favoriteCount: t.integer("r_stat_favorite_count")
    .notNull()
    .default(0),
  fiveStarCount: t.integer("r_stat_5_star_count")
    .notNull()
    .default(0),
  fourStarCount: t.integer("r_stat_4_star_count")
    .notNull()
    .default(0),
  threeStarCount: t.integer("r_stat_3_star_count")
    .notNull()
    .default(0),
  twoStarCount: t.integer("r_stat_2_star_count")
    .notNull()
    .default(0),
  oneStarCount: t.integer("r_stat_1_star_count")
    .notNull()
    .default(0),
}), (t) => [
  check("favorite_count_check", sql`${t.favoriteCount} >= 0`),
  check("rating_count_check", sql`
    ${t.fiveStarCount} >= 0 AND
    ${t.fourStarCount} >= 0 AND
    ${t.threeStarCount} >= 0 AND
    ${t.twoStarCount} >= 0 AND
    ${t.oneStarCount} >= 0
  `)
]);

export const instruction = pgTable("instruction", (t) => ({
  id: t.text("inst_id")
    .primaryKey()
    .$default(nanoid),
  title: t.text("inst_title").notNull(),
  time: t.integer("inst_time").notNull(),
  description: t.text("inst_desc").notNull(),
  index: t.integer("inst_index").notNull(),
  recipeId: t.text("recipe_id")
    .notNull()
    .references(() => recipe.id, {
      onDelete: "cascade"
    })
}), (t) => [
  check("index_check", sql`${t.index} > 0`),
  unique().on(t.recipeId, t.index),
  check("instruction_time_check", sql`${t.time} >= 0`)
]);

export const nutrition = pgTable("nutrition", (t) => ({
  id: t.text("nutr_id")
    .primaryKey()
    .$default(nanoid),
  name: t.varchar("nutr_name", { length: 100 })
  .notNull().unique(),
  description: t.text("nutr_desc").notNull(),
  allowedUnits: t.json("nutr_allowed_units")
    .$type<Unit["abbreviation"][]>()
    .notNull(),
  sortIndex: t.integer("nutr_sort_index")
    .notNull()
    .default(0)
}), (t) => [
  unique().on(t.sortIndex)
]);

export const recipeToNutrition = pgTable("recipe_to_nutrition", (t) => ({
  recipeId: t.text("recipe_id")
    .notNull()
    .references(() => recipe.id, {
      onDelete: "cascade"
    }),
  nutritionId: t.text("nutr_id")
    .notNull()
    .references(() => nutrition.id, {
      onDelete: "cascade"
    }),
  unit: t.text("rn_unit")
    .notNull()
    .$type<Unit["abbreviation"]>(),
  amount: t.numeric("unit_amount", { 
    mode: "number",
    precision: 6, 
    scale: 2
  }).notNull()
}), (t) => [
  unique().on(t.recipeId, t.nutritionId, t.unit),
  check("unit_amount_check", sql`${t.amount} >= 0`)
]);

export const ingredient = pgTable("ingredient", (t) => ({
  id: t.text("ing_id")
    .primaryKey()
    .$default(nanoid),
  name: t.varchar("ing_name", { length: 100 }).notNull(),
  recipeId: t.text("recipe_id")
    .notNull()
    .references(() => recipe.id, {
      onDelete: "cascade"
    }),
  unit: t.text("ing_unit")
    .notNull()
    .$type<Unit["abbreviation"]>(),
  amount: t.numeric("ing_amount", {
    mode: "number",
    precision: 5,
    scale: 2
  }).notNull(),
  note: t.text("ing_note")
}), (t) => [
  check("unit_amount_check", sql`${t.amount} > 0`)
]);

export const dishType = pgTable("dish_type", (t) => ({
  id: t.text("dt_id")
    .primaryKey()
    .$default(nanoid),
  name: t.varchar("dt_name", { length: 100 })
    .notNull()
    .unique(),
  description: t.text("dt_description").notNull()
}));

export const recipeToDishType = pgTable("recipe_to_dish_type", (t) => ({
  recipeId: t.text("recipe_id")
    .notNull()
    .references(() => recipe.id, {
      onDelete: "cascade"
    }),
  dishTypeId: t.text("dt_id")
    .notNull()
    .references(() => dishType.id, {
      onDelete: "cascade"
    })
}), (t) => [
  primaryKey({ 
    columns: [t.recipeId, t.dishTypeId] 
  })
]);

export const diet = pgTable("diet", (t) => ({
  id: t.text("diet_id")
    .primaryKey()
    .$default(nanoid),
  name: t.varchar("diet_name", { length: 100 })
    .notNull()
    .unique(),
  description: t.text("diet_desc").notNull()
}));

export const recipeToDiet = pgTable("recipe_to_diet", (t) => ({
  recipeId: t.text("recipe_id")
    .notNull()
    .references(() => recipe.id, {
      onDelete: "cascade"
    }),
  dietId: t.text("diet_id")
    .notNull()
    .references(() => diet.id, {
      onDelete: "cascade"
    })
}), (t) => [
  primaryKey({
    columns: [t.recipeId, t.dietId]
  })
]);

export const cuisine = pgTable("cuisine", (t) => ({
  id: t.text("cuisine_id")
    .primaryKey()
    .$default(nanoid),
  adjective: t.varchar("cuisine_adjective", {
    length: 50
  }).notNull(),
  icon: t.text("cuisine_icon").notNull(),
  iconSource: t.text("cuisine_icon_source").notNull(),
  description: t.text("cuisine_desc").notNull()
}));

export const recipeReview = pgTable("recipe_review", (t) => ({
  id: t.text("review_id")
    .primaryKey()
    .$default(nanoid),
  recipeId: t.text("recipe_id")
    .notNull()
    .references(() => recipe.id, {
      onDelete: "cascade"
    }),
  userId: t.text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade"
    }),
  rating: t.integer("review_rating").notNull(),
  content: t.text("review_content"),
  likeCount: t.integer("review_like_count")
    .notNull()
    .default(0),
  createdAt: t.timestamp("review_date_created", {
    precision: 0,
    withTimezone: true
  }).notNull()
    .defaultNow(),
  updatedAt: t.timestamp("review_date_updated", {
    precision: 0,
    withTimezone: true
  }).notNull()
    .defaultNow()
}), (t) => [
  unique().on(t.recipeId, t.userId),
  check("rating_value_check", sql`${t.rating} >= 1 AND ${t.rating} <= 5`)
]);

export const reviewLike = pgTable("review_like", (t) => ({
  userId: t.text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade"
    }),
  reviewId: t.text("review_id")
    .notNull()
    .references(() => recipeReview.id, {
      onDelete: "cascade"
    })
}), (t) => [
  primaryKey({
    columns: [t.userId, t.reviewId]
  })
]);

export const recipeFavorite = pgTable("recipe_favorite", (t) => ({
  userId: t.text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade"
    }),
  recipeId: t.text("recipe_id")
    .notNull()
    .references(() => recipe.id, {
      onDelete: "cascade"
    })
}), (t) => [
  primaryKey({
    columns: [t.userId, t.recipeId]
  })
]);

export const savedRecipe = pgTable("saved_recipe", (t) => ({
  id: t.text("saved_recipe_id")
    .primaryKey()
    .$default(nanoid),
  userId: t.text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade"
    }),
  recipeId: t.text("recipe_id")
    .references(() => recipe.id, {
      onDelete: "set null"
    }),
  saveDate: t.timestamp("save_recipe_date", {
    precision: 0,
    withTimezone: true
  }).notNull()
    .defaultNow()
}), (t) => [
  unique().on(t.userId, t.recipeId)
]);

export const recipeRelations = relations(recipe, ({ one, many }) => ({
  recipeStatistics: one(recipeStatistics, {
    fields: [recipe.id],
    references: [recipeStatistics.recipeId]
  }),
  creator: one(user, {
    fields: [recipe.createdBy],
    references: [user.id]
  }),
  instructions: many(instruction),
  nutritionalFacts: many(recipeToNutrition),
  cuisine: one(cuisine, {
    fields: [recipe.cuisineId],
    references: [cuisine.id]
  }),
  ingredients: many(ingredient),
  dishTypes: many(recipeToDishType),
  diets: many(recipeToDiet),
  mealsIncludedIn: many(mealToRecipe),
  reviews: many(recipeReview),
  favoritedBy: many(recipeFavorite),
  savedBy: many(savedRecipe)
}));

export const recipeStatisticsRelations = relations(recipeStatistics, ({ one }) => ({
  recipe: one(recipe, {
    fields: [recipeStatistics.recipeId],
    references: [recipe.id]
  })
}));

export const instructionRelations = relations(instruction, ({ one }) => ({
  recipe: one(recipe, {
    fields: [instruction.recipeId],
    references: [recipe.id]
  })
}));

export const nutritionRelations = relations(nutrition, ({ many }) => ({
  recipesUsingNutrition: many(recipeToNutrition)
}));

export const recipeToNutritionRelations = relations(recipeToNutrition, ({ one }) => ({
  recipe: one(recipe, {
    fields: [recipeToNutrition.recipeId],
    references: [recipe.id]
  }),
  nutrition: one(nutrition, {
    fields: [recipeToNutrition.nutritionId],
    references: [nutrition.id]
  })
}));

export const ingredientRelations = relations(ingredient, ({ one }) => ({
  recipe: one(recipe, {
    fields: [ingredient.recipeId],
    references: [recipe.id]
  })
}));

export const dishTypeRelations = relations(dishType, ({ many }) => ({
  recipesUsingDishType: many(recipeToDishType),
  preferredByUsers: many(userToDishType)
}));

export const recipeToDishTypeRelations = relations(recipeToDishType, ({ one }) => ({
  recipe: one(recipe, {
    fields: [recipeToDishType.recipeId],
    references: [recipe.id]
  }),
  dishType: one(dishType, {
    fields: [recipeToDishType.dishTypeId],
    references: [dishType.id]
  })
}));

export const dietRelations = relations(diet, ({ many }) => ({
  recipesUsingDiet: many(recipeToDiet),
  preferredByUsers: many(userToDiet)
}));

export const recipeToDietRelations = relations(recipeToDiet, ({ one }) => ({
  recipe: one(recipe, {
    fields: [recipeToDiet.recipeId],
    references: [recipe.id]
  }),
  diet: one(diet, {
    fields: [recipeToDiet.dietId],
    references: [diet.id]
  })
}));

export const cuisineRelations = relations(cuisine, ({ many }) => ({
  recipesFromCuisine: many(recipe),
  users: many(userToCuisine)
}));

export const recipeReviewRelations = relations(recipeReview, ({ one, many }) => ({
  recipe: one(recipe, {
    fields: [recipeReview.recipeId],
    references: [recipe.id]
  }),
  creator: one(user, {
    fields: [recipeReview.userId],
    references: [user.id]
  }),
  likedBy: many(reviewLike)
}));

export const reviewLikeRelations = relations(reviewLike, ({ one }) => ({
  review: one(recipeReview, {
    fields: [reviewLike.reviewId],
    references: [recipeReview.id]
  }),
  user: one(user, {
    fields: [reviewLike.userId],
    references: [user.id]
  })
}));

export const recipeFavoriteRelations = relations(recipeFavorite, ({ one }) => ({
  user: one(user, {
    fields: [recipeFavorite.userId],
    references: [user.id]
  }),
  recipe: one(recipe, {
    fields: [recipeFavorite.recipeId],
    references: [recipe.id]
  })
}))

export const savedRecipeRelations = relations(savedRecipe, ({ one }) => ({
  user: one(user, {
    fields: [savedRecipe.userId],
    references: [user.id]
  }),
  recipe: one(recipe, {
    fields: [savedRecipe.recipeId],
    references: [recipe.id]
  })
}));
