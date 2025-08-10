import z from "zod";
import { IdSchema, UrlSchema } from "@/lib/zod";
import { MealTypeSchema } from "@/lib/zod/meal";

export const UpcomingPlanSchema = z.object({
  id: IdSchema,
  date: z.coerce.date(),
  title: z.string(),
  tags: z.array(z.string()),
  description: z.nullable(z.string()),
  meals: z.array(z.object({
    id: IdSchema,
    title: z.string(),
    type: MealTypeSchema,
    tags: z.array(z.string()),
    description: z.nullable(z.string()),
    recipes: z.array(z.object({
      id: IdSchema,
      title: z.string(),
      image: UrlSchema,
      tags: z.array(z.string()),
      description: z.nullable(z.string()),
      prepTime: z.number(),
      calories: z.number(),
      diets: z.array(z.object({
        id: IdSchema,
        name: z.string(),
        description: z.string()
      }))
    }))
  }))
});

export type UpcomingPlan = z.infer<typeof UpcomingPlanSchema>;

export const PopularRecipeSchema = z.object({
  id: IdSchema,
  title: z.string({
    required_error: "A title is required."
  }),
  description: z.nullable(z.string()),
  saveCount: z.number({
    required_error: "A save count is required."
  }).nonnegative({
    message: "Message cannot be negative."
  }),
  image: UrlSchema,
  prepTime: z.coerce.number({
    required_error: "A prep time is required.",
    invalid_type_error: "Expected a number, but received an invalid type."
  }).nonnegative({
    message: "Prep time cannot be negative."
  }),
  diets: z.array(z.object({
    id: IdSchema,
    name: z.string({
      required_error: "A diet name is required."
    }).nonempty({
      message: "Diet name cannot be empty."
    })
  })),
  cuisine: z.nullable(z.object({ 
    id: IdSchema,
    icon: UrlSchema,
    adjective: z.string({
      required_error: "A cuisine adjective is required."
    }).nonempty({
      message: "Cuisine adjective cannot be empty."
    })
  })),
  calories: z.coerce.number({
    required_error: "Calories is required.",
    invalid_type_error: "Expected a number, but received an invalid type."
  }).nonnegative({
    message: "Calories cannot be negative."
  })
});

export type PopularRecipe = z.infer<typeof PopularRecipeSchema>;

export const MostRecentSavedRecipeSchema = z.object({
  id: IdSchema,
  title: z.string({
    required_error: "A title is required."
  }).nonempty({
    message: "Title cannot be empty."
  }),
  image: UrlSchema,
  description: z.nullable(z.string()),
  prepTime: z.coerce.number({
    invalid_type_error: "Expected a number, but received an invalid type."
  }),
  calories: z.coerce.number({
    invalid_type_error: "Expected a number, but received an invalid type."
  }),
  saveDate: z.coerce.date({
    invalid_type_error: "Expected a date, but received an invalid type."
  })
});

export type MostRecentSavedRecipe = z.infer<typeof MostRecentSavedRecipeSchema>;
