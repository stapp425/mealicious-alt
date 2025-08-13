import z from "zod/v4";
import { IdSchema, UrlSchema } from "@/lib/zod";
import { MealTypeSchema } from "@/lib/zod/meal";

export const UpcomingPlanSchema = z.object({
  id: IdSchema,
  date: z.coerce.date({
    error: (issue) => typeof issue.input === "undefined"
      ? "A plan date is required."
      : "Expected a date, but received an invalid type."
  }),
  title: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A plan title is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    error: "Plan title cannot be left empty."
  }),
  tags: z.array(
    z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "Plan tag cannot be undefined."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Plan tag cannot be left empty."
    }),
    "Expected an array, but received an invalid type."
  ),
  description: z.nullable(
    z.string("Expected a string, but received an invalid type.")
      .nonempty({
        error: "Plan description cannot be left empty."
      })),
  meals: z.array(z.object({
    id: IdSchema,
    title: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A meal title is required."
        : "Expected a string, but received an invalid type."
    }),
    type: MealTypeSchema,
    tags: z.array(
      z.string({
        error: (issue) => typeof issue.input === "undefined"
          ? "Plan tag cannot be undefined."
          : "Expected a string, but received an invalid type."
      }),
      "Expected an array, but received an invalid type."
    ),
    description: z.nullable(
      z.string("Expected a string, but received an invalid type.").nonempty({
        error: "Meal description cannot be left empty."
      })),
    recipes: z.array(
      z.object({
        id: IdSchema,
        title: z.string({
          error: (issue) => typeof issue.input === "undefined"
            ? "A recipe title is required."
            : "Expected a string, but received an invalid type."
        }),
        image: UrlSchema,
        tags: z.array(
          z.string({
            error: (issue) => typeof issue.input === "undefined"
              ? "Recipe tag cannot be undefined."
              : "Expected a string, but received an invalid type."
          }),
          "Expected an array, but received an invalid type."
        ),
        description: z.nullable(
          z.string("Expected a string, but received an invalid type.")
            .nonempty({
              error: "Recipe description cannot be left empty."
            })
        ),
        prepTime: z.number({
          error: (issue) => typeof issue.input === "undefined"
            ? "Recipe prep time is required."
            : "Expected a number, but received an invalid type."
        }).nonnegative({
          error: "Prep time cannot be negative."
        }),
        calories: z.number({
          error: (issue) => typeof issue.input === "undefined"
            ? "Recipe calories is required."
            : "Expected a number, but received an invalid type."
        }).nonnegative({
          error: "Calories cannot be negative."
        }),
        diets: z.array(
          z.object({
            id: IdSchema,
            name: z.string({
              error: (issue) => typeof issue.input === "undefined"
                ? "A diet name is required."
                : "Expected a string, but received an invalid type."
            }).nonempty({
              error: "Diet name cannot be left empty."
            }),
            description: z.string({

            })
          }),
          "Expected an array, but received an invalid type."
        )
      }),
      "Expected an array, but received an invalid type."
  )
  }))
});

export type UpcomingPlan = z.infer<typeof UpcomingPlanSchema>;

export const PopularRecipeSchema = z.object({
  id: IdSchema,
  title: z.string({
    error: "A title is required."
  }),
  description: z.nullable(
    z.string("Expected a string, but received an invalid type.")
      .nonempty({
        error: "Recipe description cannot be left empty."
      })
  ),
  saveCount: z.number({
    error: (issue) => typeof issue.input === "undefined"
      ? "A save count is required."
      : "Expected a number, but received an invalid type."
  }).int({
    abort: true,
    error: "Save count must be an integer."
  }).nonnegative({
    error: "Message cannot be negative."
  }),
  image: UrlSchema,
  prepTime: z.coerce.number({
    error: (issue) => typeof issue.input === "undefined"
      ? "A prep time is required."
      : "Expected a number, but received an invalid type."
  }).nonnegative({
    error: "Prep time cannot be negative."
  }),
  diets: z.array(
    z.object({
      id: IdSchema,
      name: z.string({
        error: (issue) => typeof issue.input === "undefined"
          ? "A diet name is required."
          : "Expected a string, but received an invalid type."
      }).nonempty({
        error: "Diet name cannot be left empty."
      })
    }),
    "Expected an array, but received an invalid type."
  ),
  cuisine: z.nullable(z.object({ 
    id: IdSchema,
    icon: UrlSchema,
    adjective: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A cuisine adjective is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Cuisine adjective cannot be empty."
    })
  })),
  calories: z.coerce.number({
    error: (issue) => typeof issue.input === "undefined"
      ? "Calories are required."
      : "Expected a number, but received an invalid type."
  }).nonnegative({
    error: "Calories cannot be negative."
  })
});

export type PopularRecipe = z.infer<typeof PopularRecipeSchema>;

export const MostRecentSavedRecipeSchema = z.object({
  id: IdSchema,
  title: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A title is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    error: "Title cannot be empty."
  }),
  image: UrlSchema,
  description: z.nullable(
    z.string("Expected a string, but received an invalid type.")
      .nonempty({
        error: "Recipe description cannot be left empty."
      })
  ),
  prepTime: z.coerce.number({
    error: (issue) => typeof issue.input === "undefined"
      ? "A recipe prep time is required."
      : "Expected a number, but received an invalid type."
  }),
  calories: z.coerce.number({
    error: (issue) => typeof issue.input === "undefined"
      ? "Calories are required."
      : "Expected a number, but received an invalid type."
  }),
  saveDate: z.coerce.date({
    error: (issue) => typeof issue.input === "undefined"
      ? "A recipe save date is required."
      : "Expected a date, but received an invalid type."
  })
});

export type MostRecentSavedRecipe = z.infer<typeof MostRecentSavedRecipeSchema>;
