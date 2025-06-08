import { relations, sql } from "drizzle-orm";
import { check, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { user } from "./user";
import { recipe } from "./recipe";
import { planToMeal } from "./plan";
import { nanoid } from "nanoid";

export const meal = pgTable("meal", (t) => ({
  id: t.text("meal_id")
    .primaryKey()
    .$default(() => nanoid()),
  title: t.varchar("meal_title", { length: 100 }).notNull(),
  description: t.text("meal_desc"),
  tags: t.json("meal_tags")
    .$type<string[]>()
    .notNull()
    .default([]),
  createdBy: t.text("meal_created_by").references(() => user.id, {
    onDelete: "cascade"
  }),
  createdAt: t.timestamp("meal_created_at", {
    precision: 0,
    withTimezone: true
  }).defaultNow()
    .notNull(),
  updatedAt: t.timestamp("meal_updated_at", {
    precision: 0,
    withTimezone: true
  }).defaultNow()
    .notNull()
}));

export const mealType = pgTable("meal_type", (t) => ({
  id: t.text("mt_id")
    .primaryKey()
    .$default(() => nanoid()),
  name: t.varchar("mt_name", { length: 100 }).notNull(),
  description: t.text("mt_desc").notNull()
}));

export const mealToType = pgTable("meal_to_type", (t) => ({
  mealId: t.text("meal_id")
    .notNull()
    .references(() => meal.id, {
      onDelete: "cascade"
    }),
  mealTypeId: t.text("mt_id")
    .notNull()
    .references(() => mealType.id, {
      onDelete: "cascade"
    })
}), (t) => [
  primaryKey({ 
    columns: [t.mealId, t.mealTypeId]
  })
]);

export const mealToRecipe = pgTable("meal_to_recipe", (t) => ({
  mealId: t.text("meal_id")
    .notNull()
    .references(() => meal.id, {
      onDelete: "cascade"
    }),
  recipeId: t.text("recipe_id")
    .notNull()
    .references(() => recipe.id, {
      onDelete: "cascade"
    })
}), (t) => [
  primaryKey({
    columns: [t.mealId, t.recipeId]
  })
]);

export const mealRelations = relations(meal, ({ one, many }) => ({
  includedRecipes: many(mealToRecipe),
  mealTypes: many(mealToType),
  plansIncludedIn: many(planToMeal),
  creator: one(user, {
    fields: [meal.createdBy],
    references: [user.id]
  })
}));

export const mealTypeRelations = relations(mealType, ({ many }) => ({
  mealsUsingType: many(mealToType)
}));

export const mealToTypeRelations = relations(mealToType, ({ one }) => ({
  meal: one(meal, {
    fields: [mealToType.mealId],
    references: [meal.id]
  }),
  mealType: one(mealType, {
    fields: [mealToType.mealTypeId],
    references: [mealType.id]
  })
}));

export const mealToRecipeRelations = relations(mealToRecipe, ({ one }) => ({
  meal: one(meal, {
    fields: [mealToRecipe.mealId],
    references: [meal.id]
  }),
  recipe: one(recipe, {
    fields: [mealToRecipe.recipeId],
    references: [recipe.id]
  })
}));
