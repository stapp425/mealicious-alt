import { mealTypes } from "@/lib/types";
import { add, endOfDay, isBefore, startOfDay } from "date-fns";
import { IdSchema } from "@/lib/zod";
import { MAX_MEAL_TITLE_LENGTH, MealTypeSchema } from "@/lib/zod/meal";
import z from "zod";


export const MAX_PLAN_TITLE_LENGTH = 100;
export const MAX_PLAN_DESCRIPTION_LENGTH = 100;
export const MAX_PLAN_MEALS = 5;

const PlanFormSchema = z.object({
  title: z.string().nonempty({
    message: "Plan title cannot be empty."
  }).max(MAX_PLAN_TITLE_LENGTH, {
    message: `Plan title cannot have more than ${MAX_PLAN_TITLE_LENGTH.toLocaleString()} characters.`
  }),
  date: z.date({
    required_error: "A plan date is required."
  }).superRefine((val, ctx) => {
    const now = new Date();
    const start = startOfDay(now);
    const end = endOfDay(add(now, { months: 1 }));

    if (isBefore(val, start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Plan date cannot be set on a past date.",
        fatal: true
      });
    }
    
    if (val > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Plan date cannot be set on a day more than 1 month in the future.",
        fatal: true
      });
    }
  }),
  tags: z.array(z.string().nonempty({
    message: "Plan tags cannot be empty."
  })),
  description: z.nullable(z.string()),
  meals: z.record(z.enum(mealTypes), z.optional(z.object({
    id: IdSchema,
    title: z.string().nonempty({
      message: "Meal title cannot be empty."
    }).max(MAX_MEAL_TITLE_LENGTH, {
      message: `Meal title cannot have more than ${MAX_MEAL_TITLE_LENGTH.toLocaleString()} characters.`
    }),
    calories: z.coerce.number()
      .int({
        message: "Amount must be an integer."
      }).nonnegative({
        message: "Amount must be not negative."
      }),
    recipes: z.array(z.object({
      id: IdSchema,
      title: z.string().nonempty({
        message: "Recipe title cannot be empty."
      }).max(MAX_PLAN_TITLE_LENGTH, {
        message: `Recipe title cannot have more than ${MAX_PLAN_TITLE_LENGTH.toLocaleString()} characters.`
      })
    }))
  }))).refine((val) => Object.keys(val).length > 0, {
    message: "Plan must have at least 1 meal included."
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
    required_error: "A plan title is required."
  }).nonempty({
    message: "Plan title cannot be empty."
  }),
  date: z.date({
    required_error: "A plan date is required."
  })
}));

export type PreviewPlan = z.infer<typeof PreviewPlanSchema.element>;

export const DetailedPlanSchema = z.array(z.object({
  id: z.string({
    required_error: "A plan ID is required."
  }).nonempty({
    message: "Plan ID cannot be empty."
  }),
  title: z.string({
    required_error: "A plan title is required."
  }).nonempty({
    message: "Plan title cannot be empty."
  }),
  description: z.nullable(z.string().nonempty({
    message: "Plan description cannot be empty."
  })),
  tags: z.array(z.string().nonempty({
    message: "Plan tag cannot be empty."
  })),
  date: z.coerce.date({
    required_error: "A date is required."
  }),
  meals: z.array(z.object({
    id: z.string({
      required_error: "A meal ID is required."
    }).nonempty({
      message: "Meal ID cannot be empty."
    }),
    title: z.string({
      required_error: "A meal title is required."
    }).nonempty({
      message: "A meal title is required."
    }),
    type: MealTypeSchema,
    tags: z.array(z.string().nonempty({
      message: "Tag cannot be empty."
    })),
    description: z.nullable(z.string().nonempty({
      message: "Meal description cannot be empty."
    })),
    recipes: z.array(z.object({
      id: z.string({
        required_error: "A recipe ID is required."
      }).nonempty({
        message: "Recipe ID cannot be empty."
      }),
      title: z.string({
        required_error: "A title is required."
      }).nonempty({
        message: "Recipe title cannot be empty."
      }),
      calories: z.coerce.number().nonnegative({
        message: "Meal calories cannot be negative."
      }),
      image: z.string({
        required_error: "An image URL is required.",
      }).url({
        message: "Image URL must be valid."
      }),
      description: z.nullable(z.string().nonempty({
        message: "Recipe description cannot be empty."
      }))
    }))
  }))
}));

export type DetailedPlan = z.infer<typeof DetailedPlanSchema.element>;
