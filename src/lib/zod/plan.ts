import { mealTypes } from "@/lib/types";
import { IdSchema, UrlSchema } from "@/lib/zod";
import { MAX_MEAL_TITLE_LENGTH, MealTypeSchema } from "@/lib/zod/meal";
import z from "zod/v4";

export const MAX_PLAN_TITLE_LENGTH = 100;
export const MAX_PLAN_DESCRIPTION_LENGTH = 100;
export const MAX_PLAN_TAG_LENGTH = 20;
export const MAX_PLAN_TAGS_LENGTH = 10;
export const MAX_PLAN_MEALS = 5;

const PlanFormSchema = z.object({
  title: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A plan title is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    abort: true,
    error: "Plan title cannot be empty."
  }).max(MAX_PLAN_TITLE_LENGTH, {
    error: `Plan title cannot have more than ${MAX_PLAN_TITLE_LENGTH.toLocaleString()} characters.`
  }),
  date: z.date({
    error: (issue) => typeof issue.input === "undefined"
      ? "A plan date is required."
      : "Expected a date, but received an invalid type."
  }),
  tags: z.array(
    z.string("Expected a string, but received an invalid type.")
      .nonempty({
        abort: true,
        error: "Plan tags cannot be empty."
      })
      .max(MAX_PLAN_TAG_LENGTH, {
        error: `A plan tag cannot have more than ${MAX_PLAN_TAG_LENGTH.toLocaleString()} characters.`
      }),
    "Expected an array, but received an invalid type."
  ).max(MAX_PLAN_TAGS_LENGTH, {
    error: `Plan cannot have more than ${MAX_PLAN_TAGS_LENGTH.toLocaleString()} tags.`
  }).refine((val) => [...new Set(val.map((str) => str.toLowerCase()))].length === val.length, {
    error: "Each tag must be unique."
  }),
  description: z.nullable(z.string("Expected a string, but received an invalid type.")),
  meals: z.partialRecord(z.enum(mealTypes), z.object({
    id: IdSchema,
    title: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A meal title is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      abort: true,
      error: "Meal title cannot be empty."
    }).max(MAX_MEAL_TITLE_LENGTH, {
      abort: true,
      error: `Meal title cannot have more than ${MAX_MEAL_TITLE_LENGTH.toLocaleString()} characters.`
    }),
    calories: z.number({
      error: (issue) => typeof issue.input === "undefined"
        ? "A meal calories amount is required."
        : "Expected a number, but received an invalid type."
    }).int({
        abort: true,
        error: "Amount must be an integer."
      }).nonnegative({
        abort: true,
        error: "Amount must be not negative."
      }),
    recipes: z.array(
      z.object({
        id: IdSchema,
        title: z.string({
          error: (issue) => typeof issue.input === "undefined"
            ? "A recipe title is required."
            : "Expected a string, but received an invalid type."
        }).nonempty({
          abort: true,
          error: "Recipe title cannot be empty."
        }).max(MAX_PLAN_TITLE_LENGTH, {
          error: `Recipe title cannot have more than ${MAX_PLAN_TITLE_LENGTH.toLocaleString()} characters.`
        })
      }),
      "Expected an array, but received an invalid type."
    )
  })).refine((val) => Object.keys(val).length > 0, {
    error: "Plan must have at least 1 meal included."
  })
});

export const CreatePlanFormSchema = PlanFormSchema;
export const EditPlanFormSchema = PlanFormSchema.extend({
  id: IdSchema
});

export type CreatePlanForm = z.infer<typeof CreatePlanFormSchema>;
export type EditPlanForm = z.infer<typeof EditPlanFormSchema>;

export const PreviewPlanSchema = z.array(z.object({
  id: IdSchema,
  title: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A plan title is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    message: "Plan title cannot be empty."
  }),
  date: z.coerce.date({
    error: (issue) => typeof issue.input === "undefined"
      ? "A plan date is required."
      : "Expected a string, but received an invalid type."
  })
}));

export type PreviewPlan = z.infer<typeof PreviewPlanSchema.element>;

export const DetailedPlanSchema = z.array(z.object({
  id: IdSchema,
  title: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A plan title is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    error: "Plan title cannot be empty."
  }),
  description: z.nullable(
    z.string("Expected a string, but received an invalid type.")
      .nonempty({
        error: "Plan description cannot be empty."
      })
  ),
  tags: z.array(
    z.string("Expected a string, but received an invalid type.")
      .nonempty({
        message: "Plan tag cannot be empty."
      }),
    "Expected an array, but received an invalid type."
  ),
  date: z.coerce.date({
    error: (issue) => typeof issue.input === "undefined"
      ? "A plan date is required."
      : "Expected a date, but received an invalid type."
  }),
  meals: z.array(
    z.object({
      id: IdSchema,
      title: z.string({
        error: (issue) => typeof issue.input === "undefined"
          ? "A meal title is required."
          : "Expected a string, but received an invalid type."
      }).nonempty({
        error: "A meal title is required."
      }),
      type: MealTypeSchema,
      tags: z.array(
        z.string("Expected a string, but received an invalid type.")
          .nonempty({
            error: "Tag cannot be empty."
          }),
        "Expected an array, but received an invalid type."
      ),
      description: z.nullable(
        z.string("Expected a string, but received an invalid type.")
          .nonempty({
            error: "Meal description cannot be empty."
          })
      ),
      recipes: z.array(
        z.object({
          id: IdSchema,
          title: z.string({
            error: (issue) => typeof issue.input === "undefined"
              ? "A recipe title is required."
              : "Expected a string, but received an invalid type."
          }).nonempty({
            error: "Recipe title cannot be empty."
          }),
          calories: z.coerce.number({
            error: (issue) => typeof issue.input === "undefined"
              ? "A recipe calories amount is required."
              : "Expected a number, but received an invalid type."
          }).nonnegative({
            error: "Meal calories cannot be negative."
          }),
          image: UrlSchema,
          description: z.nullable(
            z.string("Expected a string, but received an invalid type.")
              .nonempty({
                message: "Recipe description cannot be empty."
              })
          )
        }),
        "Expected an array, but received an invalid type."
      )
    })
  )
}));

export type DetailedPlan = z.infer<typeof DetailedPlanSchema.element>;
