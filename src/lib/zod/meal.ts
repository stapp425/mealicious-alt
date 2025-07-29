import { MealType, mealTypes } from "@/lib/types";
import { IdSchema } from "@/lib/zod";
import z from "zod";

export const MAX_MEAL_TITLE_LENGTH = 100;
export const MAX_MEAL_DESCRIPTION_LENGTH = 250;
export const MAX_MEAL_RECIPES = 5;
export const MAX_MEAL_SEARCH_CALORIES = 10000;

export const MealTypeSchema = z.custom<MealType>((val) => val && typeof val === "string", {
  message: "Value must be a valid meal type."
}).refine((val) => mealTypes.includes(val));

const MealFormSchema = z.object({
  title: z.string().nonempty({
    message: "Meal title cannot be empty."
  }).max(MAX_MEAL_TITLE_LENGTH, {
    message: `Meal title cannot have more than ${MAX_MEAL_TITLE_LENGTH.toLocaleString()} characters.`
  }),
  description: z.optional(z.string().max(MAX_MEAL_DESCRIPTION_LENGTH, {
    message: `Meal description cannot have more than ${MAX_MEAL_DESCRIPTION_LENGTH} characters.`
  })),
  tags: z.array(z.string().nonempty({
    message: "Tag cannot be empty."
  })),
  recipes: z.array(z.object({
    id: IdSchema,
    title: z.string().nonempty({
      message: "Recipe title cannot be empty."
    }),
    description: z.nullable(z.string()),
    image: z.string().nonempty({
      message: "Recipe image cannot be empty."
    })
  })).min(1, {
    message: "A meal should have at least 1 recipe included."
  }).max(MAX_MEAL_RECIPES, {
    message: `A meal can have at most ${MAX_MEAL_RECIPES.toLocaleString()} recipes`
  })
});

export const CreateMealFormSchema = MealFormSchema
export const EditMealFormSchema = MealFormSchema.extend({
  id: IdSchema.nonempty({
    message: "Meal ID cannot be empty."
  })
});

export type CreateMealForm = z.infer<typeof CreateMealFormSchema>;
export type EditMealForm = z.infer<typeof EditMealFormSchema>;

export const MealSearchSchema = z.object({
  query: z.string(),
  mealType: z.optional(MealTypeSchema),
  maxCalories: z.number()
    .int({
      message: "Amount must be an integer."
    }).nonnegative({
      message: "Amount must be not negative."
    }).max(MAX_MEAL_SEARCH_CALORIES, {
      message: `Amount must be at most ${MAX_MEAL_SEARCH_CALORIES}`
    })
});

export type MealSearch = z.infer<typeof MealSearchSchema>;
