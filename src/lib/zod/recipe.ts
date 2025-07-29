import { IdSchema, UnitSchema } from "@/lib/zod";
import z from "zod";

export const MAX_RECIPE_TITLE_LENGTH = 100;
export const MAX_RECIPE_DESCRIPTION_LENGTH = 1000;
export const MAX_RECIPE_TAGS_LENGTH = 10;
export const MAX_RECIPE_SOURCE_NAME_LENGTH = 256;
export const MAX_RECIPE_SOURCE_URL_LENGTH = 2048;
export const MAX_RECIPE_COOK_TIME_AMOUNT = 9999.99;
export const MAX_RECIPE_PREP_TIME_AMOUNT = 9999.99;
export const MAX_RECIPE_READY_TIME_AMOUNT = 9999.99;
export const MAX_RECIPE_SERVING_SIZE_AMOUNT = 9999.99;
export const MAX_RECIPE_NUTRITION_AMOUNT = 9999.99;
export const MAX_RECIPE_DIETS_LENGTH = 10;
export const MAX_RECIPE_DISH_TYPES_LENGTH = 10;
export const MAX_RECIPE_INGREDIENTS_LENGTH = 50;
export const MAX_RECIPE_INGREDIENT_AMOUNT = 999.99;
export const MAX_RECIPE_INGREDIENT_NAME_LENGTH = 100;
export const MAX_RECIPE_INSTRUCTION_TITLE_LENGTH = 100;
export const MAX_RECIPE_INSTRUCTION_TIME_AMOUNT = 999.99;
export const MAX_RECIPE_INSTRUCTION_CONTENT_LENGTH = 500;
export const MAX_RECIPE_INSTRUCTIONS_LENGTH = 50;
export const MAX_REVIEW_CONTENT_LENGTH = 256;

export const maxFileSize = {
  amount: 1024 * 1024 * 5,
  label: "5MB"
};

export const ImageSchema = z.custom<File>((val) => val instanceof File, {
  message: "A file is required."
}).superRefine((val, ctx) => {
  if (!/^.*\.(jpeg|jpg|png|webp)$/.test(val.name)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      fatal: true,
      message: "File extension must be in a valid image extension."
    });

    return z.NEVER;
  }

  if (val.size <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      fatal: true,
      type: "number",
      inclusive: true,
      minimum: 1,
      message: "File must not be empty."
    });

    return z.NEVER;
  }

  if (val.size > maxFileSize.amount) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      fatal: true,
      type: "number",
      inclusive: false,
      maximum: maxFileSize.amount,
      message: `File size cannot exceed ${maxFileSize.label}.`
    });

    return z.NEVER;
  }
});

const RecipeFormSchema = z.object({
  title: z
    .string({
      required_error: "A title is required."
    }).nonempty({
      message: "Title cannot be empty."
    }).max(MAX_RECIPE_TITLE_LENGTH, {
      message: `Title cannot exceed ${MAX_RECIPE_TITLE_LENGTH.toLocaleString()} characters.`
    }),
  description: z.optional(z.string().max(MAX_RECIPE_DESCRIPTION_LENGTH, {
    message: `Description cannot have more than ${MAX_RECIPE_DESCRIPTION_LENGTH.toLocaleString()} characters.`
  })),
  tags: z.array(z.string()).max(MAX_RECIPE_TAGS_LENGTH, {
    message: `A maximum of ${MAX_RECIPE_TAGS_LENGTH} tags is allowed.`
  }),
  source: z.optional(z.object({
    name: z.union([
      z.string().max(MAX_RECIPE_SOURCE_NAME_LENGTH, {
        message: `Source name must not exceed ${MAX_RECIPE_SOURCE_NAME_LENGTH.toLocaleString()} characters.`
      }),
      z.literal("")
    ]),
    url: z.union([
      z.string().url({
        message: "Invalid Source URL."
      }).max(MAX_RECIPE_SOURCE_URL_LENGTH, {
        message: `Source URL cannot exceed ${MAX_RECIPE_SOURCE_URL_LENGTH.toLocaleString()} characters.`
      }),
      z.literal("")
    ])
  }).refine((val) => !!val.name === !!val.url, {
    message: "Both source name and url must be either filled or empty."
  })),
  cookTime: z.coerce.number({
    required_error: "An amount is required."
  }).nonnegative({
    message: "Cook time cannot be negative."
  }).max(MAX_RECIPE_COOK_TIME_AMOUNT, {
    message: `Cook time cannot exceed ${MAX_RECIPE_COOK_TIME_AMOUNT.toLocaleString()}.`
  }),
  prepTime: z.coerce.number({
    required_error: "An amount is required."
  }).nonnegative({
    message: "Prep time cannot be negative."
  }).max(MAX_RECIPE_PREP_TIME_AMOUNT, {
    message: `Prep time cannot exceed ${MAX_RECIPE_PREP_TIME_AMOUNT.toLocaleString()}.`
  }),
  readyTime: z.coerce.number({
    required_error: "An amount is required."
  }).nonnegative({
    message: "Ready time cannot be negative."
  }).max(MAX_RECIPE_READY_TIME_AMOUNT, {
    message: `Ready time cannot exceed ${MAX_RECIPE_READY_TIME_AMOUNT.toLocaleString()}.`
  }),
  servingSize: z.object({
    amount: z.coerce.number({
      required_error: "A serving size is required."
    }).positive({
      message: "Serving size amount must be positive."
    }).max(MAX_RECIPE_SERVING_SIZE_AMOUNT, {
      message: `Serving size cannot exceed ${MAX_RECIPE_SERVING_SIZE_AMOUNT.toLocaleString()}.`
    }),
    unit: UnitSchema
  }),
  nutrition: z.array(z.object({
    id: IdSchema,
    name: z.string({
      required_error: "A name is required."
    }).max(100, {
      message: "The name cannot exceed 100 characters."
    }),
    unit: UnitSchema,
    amount: z.coerce.number({
      required_error: "An amount is required."
    }).nonnegative({
      message: "Number cannot be negative."
    }).max(MAX_RECIPE_NUTRITION_AMOUNT, {
      message: `Amount cannot exceed ${MAX_RECIPE_NUTRITION_AMOUNT}.`
    }),
    allowedUnits: z.array(UnitSchema),
  })).min(1, {
    message: "A recipe must have at least one listed nutrition value."
  }).refine((arr) => {
    const nutritionIdList = arr.map((a) => a.id);
    return [...new Set(nutritionIdList)].length === nutritionIdList.length;
  }, {
    message: "All nutrition names must be unique."
  }),
  diets: z.array(z.object({
    id: IdSchema,
    name: z.string({
      required_error: "A name is required."
    })
  })).max(MAX_RECIPE_DIETS_LENGTH, {
    message: `Recipe cannot have more than ${MAX_RECIPE_DIETS_LENGTH.toLocaleString()} elements.`
  }).refine((arr) => [...new Set(arr)].length === arr.length, {
    message: "Each element of diets must be unique."
  }),
  dishTypes: z.array(z.object({
    id: IdSchema,
    name: z.string({
      required_error: "A name is required."
    })
  })).max(MAX_RECIPE_DISH_TYPES_LENGTH, {
    message: `Recipe cannot have more than ${MAX_RECIPE_DISH_TYPES_LENGTH.toLocaleString()} dish types.`
  }).refine((arr) => [...new Set(arr)].length === arr.length, {
    message: "Each element of dish types must be unique."
  }),
  ingredients: z.array(z.object({
    name: z.string({
      required_error: "A name is required."
    }),
    isAllergen: z.boolean(),
    unit: UnitSchema,
    amount: z.coerce.number({
      required_error: "An amount is required."
    }).positive({
      message: "Amount must be positive."
    }).max(MAX_RECIPE_INGREDIENT_AMOUNT, {
      message: `Amount cannot be more than ${MAX_RECIPE_INGREDIENT_AMOUNT.toLocaleString()}.`
    }),
    note: z.optional(z.string())
  })).min(1, {
    message: "Recipe must contain at least 1 ingredient."
  }).max(MAX_RECIPE_INGREDIENTS_LENGTH, {
    message: `Recipe cannot contain more than ${MAX_RECIPE_INGREDIENTS_LENGTH.toLocaleString()} instructions.`
  }),
  cuisine: z.optional(z.object({
    id: IdSchema,
    adjective: z.string({
      required_error: "A cuisine adjective is required."
    }),
    icon: z.string({
      required_error: "A cuisine icon is required."
    })
  })),
  instructions: z.array(z.object({
    title: z.string({
      required_error: "An instruction title is required."
    }).nonempty({
      message: "Instruction title cannot be empty."
    }),
    time: z.coerce.number({
      required_error: "An instruction time is required."
    }).positive({
      message: "Instruction time must be positive."
    }).max(MAX_RECIPE_INSTRUCTION_TIME_AMOUNT, {
      message: `Instruction time cannot exceed ${MAX_RECIPE_INSTRUCTION_TIME_AMOUNT.toLocaleString()}.`
    }),
    description: z.string({
      required_error: "Instruction content is required."
    }).nonempty({
      message: "Description cannot be empty."
    }).max(MAX_RECIPE_INSTRUCTION_CONTENT_LENGTH, {
      message: `Instruction content cannot exceeed ${MAX_RECIPE_INSTRUCTION_CONTENT_LENGTH.toLocaleString()} characters.`
    })
  })).min(1, {
    message: "Recipe must include at least 1 instruction."
  }).max(MAX_RECIPE_INSTRUCTIONS_LENGTH, {
    message: `A maximum of ${MAX_RECIPE_INSTRUCTIONS_LENGTH.toLocaleString()} instructions are allowed.`
  }),
  isPublic: z.boolean()
});

export const CreateRecipeFormSchema = RecipeFormSchema.extend({
  image: ImageSchema,
});

export const EditRecipeFormSchema = RecipeFormSchema.extend({
  id: IdSchema,
  image: z.nullable(ImageSchema),
});

export type CreateRecipeForm = z.infer<typeof CreateRecipeFormSchema>;
export type EditRecipeForm = z.infer<typeof EditRecipeFormSchema>;

export const RecipeSearchSchema = z.object({
  query: z.string(),
  cuisine: z.optional(z.object({
    id: IdSchema,
    adjective: z.string({
      required_error: "A cuisine adjective is required."
    }),
    icon: z.string().nonempty({
      message: "Cuisine icon cannot be empty."
    })
  })),
  diet: z.optional(z.object({
    id: IdSchema,
    name: z.string().nonempty({
      message: "Diet name cannot be empty."
    })
  })),
  dishType: z.optional(z.object({
    id: IdSchema,
    name: z.string().nonempty({
      message: "Dish type name cannot be empty."
    })
  })),
  isUsingCuisinePreferences: z.boolean(),
  isUsingDishTypePreferences: z.boolean(),
  isUsingDietPreferences: z.boolean()
});

export type RecipeSearch = z.infer<typeof RecipeSearchSchema>;

export const RecipeSearchIndexSchema = z.object({
  results: z.array(z.object({
    hits: z.array(z.object({
      objectID: z.string({
        required_error: "An object ID is required."
      }).nonempty({
        message: "Search title ID cannot be empty."
      }),
      title: z.string({
        required_error: "A title is required."
      }).nonempty({
        message: "Search index title cannot be empty."
      })
    }))
  }))
});

export type RecipeSearchIndex = z.infer<typeof RecipeSearchIndexSchema>;

export const RecipeSearchIndexInsertionSchema = z.object({
  objectID: z.string().nonempty({
    message: "Search title ID cannot be empty."
  }),
  title: z.string().nonempty({
    message: "Search index title cannot be empty."
  }),
});

export const RecipeSearchIndexDeletionSchema = RecipeSearchIndexInsertionSchema.omit({
  title: true
});

export type RecipeSearchIndexInsertion = z.infer<typeof RecipeSearchIndexInsertionSchema>;
export type RecipeSearchIndexDeletion = z.infer<typeof RecipeSearchIndexDeletionSchema>;

export const CreateReviewFormSchema = z.object({
  rating: z.number({
    required_error: "A rating is required."
  }).int({
    message: "Rating must be an integer."
  }).min(1, {
    message: "Rating cannot be below 1 star."
  }).max(5, {
    message: "Rating cannot be above 5 stars."
  }),
  content: z.optional(z.string({
    required_error: "Review content is required."
  }).max(MAX_REVIEW_CONTENT_LENGTH, {
    message: `Review content cannot have more than ${MAX_REVIEW_CONTENT_LENGTH.toLocaleString()} characters.`
  }))
});

export type CreateReviewForm = z.infer<typeof CreateReviewFormSchema>;
