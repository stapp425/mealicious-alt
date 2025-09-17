import { check, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { cuisine, diet, dishType, recipe, recipeFavorite, recipeReview, reviewLike, savedRecipe } from "./recipe";
import { relations, sql } from "drizzle-orm";
import { account, emailVerification, passwordReset, session } from "@/db/schema/auth";
import { meal } from "@/db/schema/meal";
import { plan } from "@/db/schema/plan";
import { nanoid } from "nanoid";

export const user = pgTable("user", (t) => ({
  id: t.text("user_id")
    .primaryKey()
    .$default(nanoid),
  name: t.text("user_name")
    .unique()
    .notNull(),
  about: t.text("user_about"),
  email: t.text("user_email")
    .unique()
    .notNull(),
  emailVerified: t.timestamp("emailVerified", { mode: "date" }),
  password: t.text("user_password"),
  image: t.text("image"),
  createdAt: t.date("user_created_at", {
    mode: "date"
  }).notNull()
    .defaultNow()
}));

export const userToCuisine = pgTable("user_to_cuisine", (t) => ({
  userId: t.text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade"
    }),
  cuisineId: t.text("cuisine_id")
    .notNull()
    .references(() => cuisine.id, {
      onDelete: "cascade"
    }),
  preferenceScore: t.integer("cuisine_score")
    .notNull()
    .default(1)
}), (t) => [
  primaryKey({ 
    columns: [t.userId, t.cuisineId]
  })
]);

export const userToDishType = pgTable("user_to_dish_type", (t) => ({
  userId: t.text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade"
    }),
  dishTypeId: t.text("diet_id")
    .notNull()
    .references(() => dishType.id),
  preferenceScore: t.integer("udt_score")
    .notNull()
    .default(1)
}), (t) => [
  primaryKey({
    columns: [t.userId, t.dishTypeId]
  }),
  check("preference_score_check", sql`${t.preferenceScore} >= 0`)
]);

export const userToDiet = pgTable("user_to_diet", (t) => ({
  userId: t.text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade"
    }),
  dietId: t.text("diet_id")
    .notNull()
    .references(() => diet.id, {
      onDelete: "cascade"
    }),
  preferenceScore: t.integer("ud_score")
    .notNull()
    .default(1)
}), (t) => [
  primaryKey({
    columns: [t.userId, t.dietId]
  }),
  check("preference_score_check", sql`${t.preferenceScore} >= 0`)
]);

export const userRelations = relations(user, ({ one, many }) => ({
  account: one(account, {
    fields: [user.id],
    references: [account.userId]
  }),
  emailVerification: one(emailVerification, {
    fields: [user.email],
    references: [emailVerification.email]
  }),
  passwordReset: one(passwordReset, {
    fields: [user.email],
    references: [passwordReset.email]
  }),
  recipesCreated: many(recipe),
  mealsCreated: many(meal),
  plansCreated: many(plan),
  preferredDishTypes: many(userToDishType),
  preferredDiets: many(userToDiet),
  preferredCuisines: many(userToCuisine),
  createdReviews: many(recipeReview),
  likedReviews: many(reviewLike),
  favoritedRecipes: many(recipeFavorite),
  sessions: many(session),
  savedRecipes: many(savedRecipe)
}));

export const userToCuisineRelations = relations(userToCuisine, ({ one }) => ({
  user: one(user, {
    fields: [userToCuisine.userId],
    references: [user.id]
  }),
  cuisine: one(cuisine, {
    fields: [userToCuisine.cuisineId],
    references: [cuisine.id]
  })
}));

export const userToDishTypeRelations = relations(userToDishType, ({ one }) => ({
  user: one(user, {
    fields: [userToDishType.userId],
    references: [user.id]
  }),
  dishType: one(dishType, {
    fields: [userToDishType.dishTypeId],
    references: [dishType.id]
  })
}));

export const userToDietRelations = relations(userToDiet, ({ one }) => ({
  user: one(user, {
    fields: [userToDiet.userId],
    references: [user.id]
  }),
  diet: one(diet, {
    fields: [userToDiet.dietId],
    references: [diet.id]
  })
}));
