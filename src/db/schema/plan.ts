import { pgTable, primaryKey, unique } from "drizzle-orm/pg-core";
import { user } from "./user";
import { relations } from "drizzle-orm";
import { meal } from "./meal";
import { nanoid } from "nanoid";
import { MealType } from "@/lib/types";

export const plan = pgTable("plan", (t) => ({
  id: t.text("plan_id")
    .primaryKey()
    .$default(nanoid),
  title: t.varchar("plan_title", { length: 100 }).notNull(),
  description: t.text("plan_desc"),
  tags: t.json("plan_tags")
    .$type<string[]>()
    .notNull()
    .default([]),
  date: t.date("plan_date", {
    mode: "date"
  }).notNull()
    .unique(),
  createdBy: t.text("plan_created_by").references(() => user.id, {
    onDelete: "cascade"
  }),
  createdAt: t.timestamp("plan_created_at", {
    precision: 0,
    withTimezone: true
  }).defaultNow()
    .notNull(),
  updatedAt: t.timestamp("plan_updated_at", {
    precision: 0,
    withTimezone: true
  }).defaultNow()
    .notNull()
}), (t) => [
  unique().on(t.createdBy, t.date)
]);

export const planToMeal = pgTable("plan_to_meal", (t) => ({
  planId: t.text("plan_id")
    .notNull()
    .references(() => plan.id, {
      onDelete: "cascade"
    }),
  mealId: t.text("meal_id")
    .notNull()
    .references(() => meal.id, {
      onDelete: "cascade"
    }),
  type: t.text("pm_type")
    .$type<MealType>()
    .notNull()
}), (t) => [
  primaryKey({
    columns: [t.planId, t.mealId, t.type]
  })
]);

export const planRelations = relations(plan, ({ one, many }) => ({
  meals: many(planToMeal),
  creator: one(user, {
    fields: [plan.createdBy],
    references: [user.id]
  })
}));

export const planToMealRelations = relations(planToMeal, ({ one }) => ({
  plan: one(plan, {
    fields: [planToMeal.planId],
    references: [plan.id]
  }),
  meal: one(meal, {
    fields: [planToMeal.mealId],
    references: [meal.id]
  })
}));
