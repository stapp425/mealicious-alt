import { IdSchema, UnitSchema, UrlSchema } from "@/lib/zod";
import z from "zod/v4";
import { filters, Sort, sorts } from "@/lib/types";

export const MAX_RECIPE_TITLE_LENGTH = 100;
export const MAX_RECIPE_DESCRIPTION_LENGTH = 1000;
export const MAX_RECIPE_TAG_LENGTH = 20;
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
export const MAX_RECIPE_INGREDIENT_NOTE_LENGTH = 50;
export const MAX_RECIPE_INSTRUCTION_TITLE_LENGTH = 100;
export const MAX_RECIPE_INSTRUCTION_TIME_AMOUNT = 999.99;
export const MAX_RECIPE_INSTRUCTION_CONTENT_LENGTH = 500;
export const MAX_RECIPE_INSTRUCTIONS_LENGTH = 50;
export const MAX_REVIEW_CONTENT_LENGTH = 256;

export const maxFileSize = {
  amount: 1024 * 1024 * 5,
  label: "5MB"
};

export const ImageSchema = z.file({
  error: (issue) => typeof issue.input === "undefined"
    ? "A file is required."
    : "Expected a file, but received an invalid type."
}).mime(["image/jpeg", "image/png", "image/webp"], {
    abort: true,
    error: "File must be in a static image format."
  })
  .min(1, {
    abort: true,
    error: "File must not be empty."
  })
  .max(maxFileSize.amount, {
    error: `File size must not exceed ${maxFileSize.label}.`
  });

const RecipeFormSchema = z.object({
  title: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A recipe title is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    abort: true,
    error: "Title cannot be empty."
  }).max(MAX_RECIPE_TITLE_LENGTH, {
    error: `Title cannot exceed ${MAX_RECIPE_TITLE_LENGTH.toLocaleString()} characters.`
  }),
  description: z.optional(
    z.string("Expected a string, but received an invalid type.")
      .max(MAX_RECIPE_DESCRIPTION_LENGTH, {
        error: `Description cannot have more than ${MAX_RECIPE_DESCRIPTION_LENGTH.toLocaleString()} characters.`
      })
  ),
  tags: z.array(
    z.string("Expected a string, but received an invalid type.")
      .nonempty({
        error: "Tag cannot be left empty."
      })
      .max(MAX_RECIPE_TAG_LENGTH, {
        error: `Tag cannot have more than ${MAX_RECIPE_TAG_LENGTH.toLocaleString()} characters.`
      }),
    "Expected an array, but received an invalid type."
  ).max(MAX_RECIPE_TAGS_LENGTH, {
    abort: true,
    error: `A maximum of ${MAX_RECIPE_TAGS_LENGTH} tags is allowed.`
  }).refine((val) => [...new Set(val.map((str) => str.toLowerCase()))].length === val.length, {
    error: "Each tag must be unique."
  }),
  source: z.optional(z.object({
    name: z.string("Expected a string, but received an invalid type.")
      .max(MAX_RECIPE_SOURCE_NAME_LENGTH, {
        error: `Source name must not exceed ${MAX_RECIPE_SOURCE_NAME_LENGTH.toLocaleString()} characters.`
      }
    ),
    url: z.union([
      UrlSchema.max(MAX_RECIPE_SOURCE_URL_LENGTH, {
        error: `Source URL cannot exceed ${MAX_RECIPE_SOURCE_URL_LENGTH.toLocaleString()} characters.`
      }),
      z.literal("")
    ])
  }).refine((val) => !!val.name === !!val.url, {
    error: "Both source name and URL must be either filled or empty."
  })),
  cookTime: z.number({
    error: (issue) => typeof issue.input === "undefined"
      ? "A recipe cook time amount is required."
      : "Expected a number, but received an invalid type."
  }).nonnegative({
    abort: true,
    error: "Cook time cannot be negative."
  }).max(MAX_RECIPE_COOK_TIME_AMOUNT, {
    error: `Cook time cannot exceed ${MAX_RECIPE_COOK_TIME_AMOUNT.toLocaleString()}.`
  }).transform(Math.round),
  prepTime: z.number({
    error: (issue) => typeof issue.input === "undefined"
      ? "A recipe prep time amount is required."
      : "Expected a number, but received an invalid type."
  }).nonnegative({
    abort: true,
    error: "Prep time cannot be negative."
  }).max(MAX_RECIPE_PREP_TIME_AMOUNT, {
    error: `Prep time cannot exceed ${MAX_RECIPE_PREP_TIME_AMOUNT.toLocaleString()}.`
  }).transform(Math.round),
  readyTime: z.number({
    error: (issue) => typeof issue.input === "undefined"
      ? "A recipe ready time amount is required."
      : "Expected a number, but received an invalid type."
  }).nonnegative({
    abort: true,
    error: "Ready time cannot be negative."
  }).max(MAX_RECIPE_READY_TIME_AMOUNT, {
    error: `Ready time cannot exceed ${MAX_RECIPE_READY_TIME_AMOUNT.toLocaleString()}.`
  }).transform(Math.round),
  servingSize: z.object({
    amount: z.number({
      error: (issue) => typeof issue.input === "undefined"
        ? "A recipe serving size is required."
        : "Expected a number, but received an invalid type."
    }).positive({
      abort: true,
      error: "Serving size amount must be positive."
    }).max(MAX_RECIPE_SERVING_SIZE_AMOUNT, {
      error: `Serving size cannot exceed ${MAX_RECIPE_SERVING_SIZE_AMOUNT.toLocaleString()}.`
    }).transform((val) => Number(val.toFixed(2))), // if a floating number, only store up to 2 most significant digits
    unit: UnitSchema
  }),
  nutrition: z.array(z.object({
    id: IdSchema,
    name: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A name is required."
        : "Expected a string, but received an invalid type."
    }).max(100, {
      message: "The name cannot exceed 100 characters."
    }),
    unit: UnitSchema,
    amount: z.number({
      error: (issue) => typeof issue.input === "undefined"
        ? "An amount is required."
        : "Expected a number, but received an invalid type."
    }).nonnegative({
      abort: true,
      error: "Number cannot be negative."
    }).max(MAX_RECIPE_NUTRITION_AMOUNT, {
      error: `Amount cannot exceed ${MAX_RECIPE_NUTRITION_AMOUNT}.`
    }).transform((val) => Number(val.toFixed(2))),
    allowedUnits: z.array(UnitSchema, "Expected an array, but received an invalid type."),
  })).nonempty({
    abort: true,
    error: "A recipe must have at least one listed nutrition value."
  }).refine((arr) => {
    const nutritionIdList = arr.map(({ id }) => id);
    return [...new Set(nutritionIdList)].length === nutritionIdList.length;
  }, {
    error: "All nutrition names must be unique."
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
  ).max(MAX_RECIPE_DIETS_LENGTH, {
    abort: true,
    error: `Recipe cannot have more than ${MAX_RECIPE_DIETS_LENGTH.toLocaleString()} diets.`
  }).refine((arr) => [...new Set(arr)].length === arr.length, {
    error: "Each element of diets must be unique."
  }),
  dishTypes: z.array(
    z.object({
      id: IdSchema,
      name: z.string({
        error: (issue) => typeof issue.input === "undefined"
          ? "A dish type name is required."
          : "Expected a string, but received an invalid type."
      }).nonempty({
        error: "Dish type name cannot be left empty."
      })
    }),
    "Expected an array, but received an invalid type."
  ).max(MAX_RECIPE_DISH_TYPES_LENGTH, {
    abort: true,
    error: `Recipe cannot have more than ${MAX_RECIPE_DISH_TYPES_LENGTH.toLocaleString()} dish types.`
  }).refine((arr) => [...new Set(arr.map(({ id }) => id))].length === arr.length, {
    error: "Each element of dish types must be unique."
  }),
  ingredients: z.array(z.object({
    name: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "An ingredient name is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      abort: true,
      error: "Name cannot be empty."
    }).max(MAX_RECIPE_INGREDIENT_NAME_LENGTH, {
      error: `Name cannot have more than ${MAX_RECIPE_INGREDIENT_NAME_LENGTH.toLocaleString()} characters.`
    }),
    amount: z.number({
      error: (issue) => typeof issue.input === "undefined"
        ? "An ingredient amount is required."
        : "Expected a number, but received an invalid type."
    }).positive({
      abort: true,
      error: "Amount must be positive."
    }).max(MAX_RECIPE_INGREDIENT_AMOUNT, {
      error: `Amount must be at most ${MAX_RECIPE_INGREDIENT_AMOUNT.toLocaleString()}.`
    }).transform((val) => Number(val.toFixed(2))),
    unit: UnitSchema,
    note: z.optional(
      z.string("Expected a string, but received an invalid type.")
        .nonempty({
          abort: true,
          error: "Ingredient note cannot be empty."
        })
        .max(MAX_RECIPE_INGREDIENT_NOTE_LENGTH, {
          error: `Ingredient note cannot have more than ${MAX_RECIPE_INGREDIENT_NOTE_LENGTH.toLocaleString()} characters.`
        })
    )
  })).nonempty({
    abort: true,
    error: "Recipe must contain at least 1 ingredient."
  }).max(MAX_RECIPE_INGREDIENTS_LENGTH, {
    error: `Recipe cannot contain more than ${MAX_RECIPE_INGREDIENTS_LENGTH.toLocaleString()} instructions.`
  }),
  cuisine: z.optional(z.object({
    id: IdSchema,
    adjective: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A cuisine adjective is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Cuisine adjective cannot be left empty."
    }),
    icon: UrlSchema
  })),
  instructions: z.array(z.object({
  title: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "An instruction title is required."
      : "Expected a string, but received an invalid type."
    }).nonempty({
      abort: true,
      error: "Instruction title cannot be empty."
    }).max(MAX_RECIPE_INSTRUCTION_TITLE_LENGTH, {
      abort: true,
      error: `Instruction title length cannot exceed ${MAX_RECIPE_INSTRUCTION_TITLE_LENGTH.toLocaleString()} characters.`
    }),
    time: z.number({
      error: (issue) => typeof issue.input === "undefined"
        ? "An instruction time is required."
        : "Expected a number, but received an invalid type."
    }).positive({
      error: "Instruction time must be positive."
    }).int({
      error: "Instruction time must be an integer."
    }).max(MAX_RECIPE_INSTRUCTION_TIME_AMOUNT, {
      error: `Instruction time cannot exceed ${MAX_RECIPE_INSTRUCTION_TIME_AMOUNT.toLocaleString()}.`
    }),
    description: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "An instruction content is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      abort: true,
      error: "Instruction content cannot be empty."
    }).max(MAX_RECIPE_INSTRUCTION_CONTENT_LENGTH, {
      error: `Instruction content must have at most ${MAX_RECIPE_INSTRUCTION_CONTENT_LENGTH.toLocaleString()} characters.`
    })
  })).nonempty({
    abort: true,
    error: "Recipe must include at least 1 instruction."
  }).max(MAX_RECIPE_INSTRUCTIONS_LENGTH, {
    error: `A maximum of ${MAX_RECIPE_INSTRUCTIONS_LENGTH.toLocaleString()} instructions are allowed.`
  }),
  isPublic: z.boolean("Expected a boolean, but received an invalid type.")
});

export const CreateRecipeFormSchema = RecipeFormSchema.extend({
  image: ImageSchema,
});

export type CreateRecipeForm = z.infer<typeof CreateRecipeFormSchema>;

export const EditRecipeFormSchema = RecipeFormSchema.extend({
  id: IdSchema,
  image: z.nullable(ImageSchema),
});

export type EditRecipeForm = z.infer<typeof EditRecipeFormSchema>;

export const SavedRecipeSearchSchema = z.object({
  query: z.string("Expected a string, but received an invalid type."),
  sort: z.optional(
    z.custom<Sort>((val) => typeof val === "string" && sorts.includes(val as Sort), {
      error: "Expected a valid sort value, but received an invalid type."
    })
  ),
  filters: z.array(
    z.enum(filters, {
      error: "Invalid filter value(s) detected."
    }),
    "Expected an array, but received an invalid type."
  ).transform((val) => [...new Set(val)])
});

export type SavedRecipeSearch = z.infer<typeof SavedRecipeSearchSchema>;

export const RecipeSearchSchema = z.object({
  query: z.string("Expected a string, but received an invalid type."),
  cuisine: z.optional(z.object({
    id: IdSchema,
    adjective: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A cuisine adjective is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Cuisine adjective cannot be left empty."
    }),
    icon: UrlSchema
  })),
  diet: z.optional(
    z.object({
      id: IdSchema,
      name: z.string("Expected a string, but received an invalid type.")
        .nonempty({
          error: "Diet name cannot be empty."
        })
    })
  ),
  dishType: z.optional(z.object({
    id: IdSchema,
    name: z.string("Expected a string, but received an invalid type.")
      .nonempty({
        error: "Dish type name cannot be empty."
      })
  })),
  isUsingCuisinePreferences: z.boolean("Expected a boolean, but received an invalid type."),
  isUsingDishTypePreferences: z.boolean("Expected a boolean, but received an invalid type."),
  isUsingDietPreferences: z.boolean("Expected a boolean, but received an invalid type.")
});

export type RecipeSearch = z.infer<typeof RecipeSearchSchema>;

export const RecipeSearchIndexSchema = z.object({
  results: z.array(z.object({
    hits: z.array(z.object({
      objectID: z.string({
        error: (issue) => typeof issue.input === "undefined"
          ? "An object id is required."
          : "Expected a string, but received an invalid type."
      }).nonempty({
        error: "Search title ID cannot be empty."
      }),
      title: z.string({
        error: (issue) => typeof issue.input === "undefined"
          ? "A title is required."
          : "Expected a string, but received an invalid type."
      }).nonempty({
        error: "Search index title cannot be empty."
      })
    }))
  })).length(1, {
    error: "Result object must only have one element."
  })
}).transform((val) => val.results[0].hits);

export type RecipeSearchIndex = z.infer<typeof RecipeSearchIndexSchema>[number];

export const RecipeSearchIndexInsertionSchema = z.object({
  objectID: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "An object id is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    error: "Search index id cannot be empty."
  }),
  title: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A title is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    error: "Search index title cannot be empty."
  })
});

export const RecipeSearchIndexDeletionSchema = RecipeSearchIndexInsertionSchema.omit({
  title: true
});

export type RecipeSearchIndexInsertion = z.infer<typeof RecipeSearchIndexInsertionSchema>;
export type RecipeSearchIndexDeletion = z.infer<typeof RecipeSearchIndexDeletionSchema>;

export const RecentRecipeSearch = z.array(
  z.object({
    id: IdSchema,
    label: z.string({
      error: (issue) => issue.input === undefined
        ? "A label is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Label cannot be left empty."
    }),
    category: z.optional(
      z.string("Expected a string, but received an invalid type")
        .nonempty({
          error: "Category cannot be left empty."
        })
    )
  }),
  "Expected an array, but received an invalid type."
);

export type RecentRecipeSearch = z.infer<typeof RecentRecipeSearch>[number];

export const CreateReviewFormSchema = z.object({
  rating: z.number({
    error: (issue) => typeof issue.input === "undefined"
      ? "A rating is required."
      : "Expected a number, but received an invalid type."
  }).int({
    abort: true,
    error: "Rating must be an integer."
  }).min(1, {
    abort: true,
    error: "Rating cannot be below 1 star."
  }).max(5, {
    error: "Rating cannot be above 5 stars."
  }),
  content: z.optional(
    z.string("Expected a string, but received an invalid type.")
      .max(MAX_REVIEW_CONTENT_LENGTH, {
        error: `Review content cannot have more than ${MAX_REVIEW_CONTENT_LENGTH.toLocaleString()} characters.`
      })
  )
});

export type CreateReviewForm = z.infer<typeof CreateReviewFormSchema>;
