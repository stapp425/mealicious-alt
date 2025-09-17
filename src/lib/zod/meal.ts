import { MealType, mealTypes } from "@/lib/types";
import { IdSchema, UrlSchema } from "@/lib/zod";
import z from "zod/v4";

export const MAX_MEAL_TITLE_LENGTH = 100;
export const MAX_MEAL_DESCRIPTION_LENGTH = 250;
export const MAX_MEAL_TAG_LENGTH = 20;
export const MAX_MEAL_TAGS_LENGTH = 10;
export const MAX_MEAL_RECIPES = 5;
export const MAX_MEAL_SEARCH_CALORIES = 10000;

export const MealTypeSchema = z.custom<MealType>((val) => val && typeof val === "string", {
  error: "Value must be a valid meal type."
}).refine((val) => mealTypes.includes(val));

const MealFormSchema = z.object({
  title: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A meal title is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    abort: true,
    error: "Meal title cannot be empty."
  }).max(MAX_MEAL_TITLE_LENGTH, {
    error: `Meal title cannot have more than ${MAX_MEAL_TITLE_LENGTH.toLocaleString()} characters.`
  }),
  description: z.optional(
    z.string("Expected a string, but received an invalid type.")
      .max(MAX_MEAL_DESCRIPTION_LENGTH, {
        error: `Meal description cannot have more than ${MAX_MEAL_DESCRIPTION_LENGTH} characters.`
      })
  ),
  tags: z.array(
    z.string("Expected a string, but received an invalid type.")
      .nonempty({
        abort: true,
        error: "Meal tag cannot be left empty."
      })
      .max(MAX_MEAL_TAG_LENGTH, {
        error: `Meal tag cannot have more than ${MAX_MEAL_TAG_LENGTH.toLocaleString()} characters.`
      }),
    "Expected an array, but received an invalid type."
  ).max(MAX_MEAL_TAGS_LENGTH, {
    abort: true,
    error: `A maximum of ${MAX_MEAL_TAGS_LENGTH} tags is allowed.`
  }).refine((val) => [...new Set(val.map((str) => str.toLowerCase()))].length === val.length, {
    error: "Each tag must be unique."
  }),
  recipes: z.array(
    z.object({
      id: IdSchema,
      title: z.string({
        error: (issue) => typeof issue.input === "undefined"
          ? "A recipe title is required."
          : "Expected a string, but received an invalid type."
      }).nonempty({
        error: "Recipe title cannot be left empty."
      }),
      description: z.nullable(
        z.string("Expected a string, but received an invalid type.")
          .nonempty({
            error: "Recipe description cannot be left empty."
          })
      ),
      image: UrlSchema
    }),
    "Expected an array, but received an invalid type."
  ).min(1, {
    error: "A meal should have at least 1 recipe included."
  }).max(MAX_MEAL_RECIPES, {
    error: `A meal can have at most ${MAX_MEAL_RECIPES.toLocaleString()} recipes`
  })
});

export const CreateMealFormSchema = MealFormSchema;

export const EditMealFormSchema = MealFormSchema.extend({
  id: IdSchema
});

export type CreateMealForm = z.infer<typeof CreateMealFormSchema>;
export type EditMealForm = z.infer<typeof EditMealFormSchema>;

export const MealSearchSchema = z.object({
  query: z.optional(z.string("Expected a string, but received an invalid type.")),
  mealType: z.optional(MealTypeSchema),
  maxCalories: z.number({
    error: (issue) => typeof issue.input === "undefined"
      ? "A max calories amount is required."
      : "Expected a number, but received an invalid type."
  }).int({
      abort: true,
      error: "Amount must be an integer."
    }).nonnegative({
      abort: true,
      error: "Amount must be not negative."
    }).max(MAX_MEAL_SEARCH_CALORIES, {
      error: `Amount must be at most ${MAX_MEAL_SEARCH_CALORIES}`
    })
});

export type MealSearch = z.infer<typeof MealSearchSchema>;
