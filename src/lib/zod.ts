import z from "zod";
import { Unit, units } from "@/db/data/unit";

export const MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB

export const CreateUsernameSchema = z.string({
  required_error: "A username is required."
}).min(6, {
  message: "Username must have at least 6 characters long."
}).max(20, {
  message: "Username cannot have more than 20 characters."
}).regex(/^[^_].*[^_]$/, {
  message: "Username cannot start or end with a _."
}).regex(/^[^\W]+$/, {
  message: "Username cannot contain symbols."
});

export const EmailSchema = z.string({
  required_error: "An e-mail is required.",
}).email({
  message: "Input does not match a valid e-mail format."
});

export const CreatePasswordSchema = z.string({
  required_error: "A password is required."
}).min(12, {
  message: "Password must have at least 12 characters."
}).max(20, {
  message: "Password cannot have more than 20 characters."
}).regex(/^.*[A-Z].*$/, {
  message: "Password must contain at least one uppercase letter."
}).regex(/^.*[_\W].*$/, {
  message: "Password must contain at least one symbol."
}).regex(/^.*[0-9]+.*$/, {
  message: "Password must contain at least one digit."
});

export const IdSchema = z.string({
  required_error: "An id is required."
});

export const UrlSchema = z.object({
  url: z.string({
    required_error: "A url is required."
  }).url({
    message: "String must be a valid URL."
  })
});

export const UnitSchema = z.custom<Unit["abbreviation"]>((val) => (
  typeof val === "string" && val
), {
  message: "Value must not be empty."
}).refine((val) => (
  units.find(({ abbreviation }) => abbreviation == val)
), {
  message: "Value must be a valid unit."
});

export const ImageFileSchema = z.custom<File>((val) => val instanceof File, {
  message: "File is required."
}).refine((val) => /^.*\.(jpeg|jpg|png|webp)$/.test(val.name), {
    message: "File extension must be in a valid image extension."
  }).refine((val) => /^image\/(jpeg|jpg|png|webp)$/.test(val.type), {
    message: "File type must be an image."
  }).refine((val) => val.size > 0, {
    message: "File must not be empty.",
  }).refine((val) => val.size <= MAX_FILE_SIZE, {
    message: "File size cannot exceed 5MB."
  });

export const ImageDataSchema = z.object({
  name: z.string({
    required_error: "A file name is required."
  }).regex(/^.*\.(jpeg|jpg|png|webp)$/, {
    message: "File extension must have a valid image extension."
  }),
  size: z.coerce.number({
    required_error: "A file size is required."
  }).min(1, {
    message: "File size must be greater than 0B."
  }).max(MAX_FILE_SIZE, {
    message: "File size must be at most 5MB."
  }),
  type: z.string({
    required_error: "A file type is required."
  }).regex(/^image\/(jpeg|jpg|png|webp)$/, {
    message: "The file must be a valid image type."
  })
});

export const SignInFormSchema = z.object({
  email: EmailSchema,
  password: z.string({
    message: "A password is required."
  })
});

export const SignUpFormSchema = z.object({
  name: CreateUsernameSchema,
  email: EmailSchema,
  password: CreatePasswordSchema,
  confirmPassword: z.string()
}).refine(({ password, confirmPassword }) => 
  password === confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  }
);

export type SignUpForm = z.infer<typeof SignUpFormSchema>;

export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_TAGS_LENGTH = 10;
export const MAX_SOURCE_NAME_LENGTH = 256;
export const MAX_SOURCE_URL_LENGTH = 2048;
export const MAX_COOK_TIME_AMOUNT = 9999.99;
export const MAX_PREP_TIME_AMOUNT = 9999.99;
export const MAX_READY_TIME_AMOUNT = 9999.99;
export const MAX_SERVING_SIZE_AMOUNT = 9999.99;
export const MAX_NUTRITION_AMOUNT = 9999.99;
export const MAX_DIETS_LENGTH = 10;
export const MAX_DISH_TYPES_LENGTH = 10;
export const MAX_INGREDIENTS_LENGTH = 50;
export const MAX_INGREDIENT_AMOUNT = 999.99;
export const MAX_INGREDIENT_NAME_LENGTH = 100;
export const MAX_INSTRUCTION_TITLE_LENGTH = 100;
export const MAX_INSTRUCTION_TIME_AMOUNT = 999.99;
export const MAX_INSTRUCTION_CONTENT_LENGTH = 500;
export const MAX_INSTRUCTIONS_LENGTH = 50;

export const MAX_REVIEW_CONTENT_LENGTH = 256;

export const RecipeCreationSchema = z.object({
  title: z
    .string({
      required_error: "A title is required."
    }).nonempty({
      message: "Title cannot be empty."
    }).max(MAX_TITLE_LENGTH, {
      message: `Title cannot exceed ${MAX_TITLE_LENGTH.toLocaleString()} characters.`
    }),
  image: ImageFileSchema,
  description: z.optional(z.string().max(MAX_DESCRIPTION_LENGTH, {
    message: `Description cannot have more than ${MAX_DESCRIPTION_LENGTH.toLocaleString()} characters.`
  })),
  tags: z.array(z.string()).max(MAX_TAGS_LENGTH, {
    message: `A maximum of ${MAX_TAGS_LENGTH} tags is allowed.`
  }),
  source: z.object({
    name: z.union([
      z.string().max(MAX_SOURCE_NAME_LENGTH, {
        message: `Source name must not exceed ${MAX_SOURCE_NAME_LENGTH.toLocaleString()} characters.`
      }),
      z.literal("")
    ]),
    url: z.union([
      z.string().url({
        message: "Invalid Source URL."
      }).max(MAX_SOURCE_URL_LENGTH, {
        message: `Source URL cannot exceed ${MAX_SOURCE_URL_LENGTH.toLocaleString()} characters.`
      }),
      z.literal("")
    ])
  }).refine((val) => !!val.name === !!val.url, {
    message: "Both source name and url must be either filled or empty."
  }).optional(),
  cookTime: z.coerce.number({
    required_error: "An amount is required."
  }).positive({
    message: "Time must be positive."
  }).max(MAX_COOK_TIME_AMOUNT, {
    message: `Time cannot exceed ${MAX_COOK_TIME_AMOUNT.toLocaleString()}.`
  }),
  prepTime: z.coerce.number({
    required_error: "An amount is required."
  }).positive({
    message: "Time must be positive."
  }).max(MAX_PREP_TIME_AMOUNT, {
    message: `Time cannot exceed ${MAX_PREP_TIME_AMOUNT.toLocaleString()}.`
  }),
  readyTime: z.coerce.number({
    required_error: "An amount is required."
  }).positive({
    message: "Time must be positive."
  }).max(MAX_READY_TIME_AMOUNT, {
    message: `Time cannot exceed ${MAX_READY_TIME_AMOUNT.toLocaleString()}.`
  }),
  servingSize: z.object({
    amount: z.coerce.number({
      required_error: "A serving size is required."
    }).positive({
      message: "Serving size amount must be positive."
    }).max(MAX_SERVING_SIZE_AMOUNT, {
      message: `Serving size cannot exceed ${MAX_SERVING_SIZE_AMOUNT.toLocaleString()}.`
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
    }).max(MAX_NUTRITION_AMOUNT, {
      message: `Amount cannot exceed ${MAX_NUTRITION_AMOUNT}.`
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
  })).max(MAX_DIETS_LENGTH, {
    message: `Recipe cannot have more than ${MAX_DIETS_LENGTH.toLocaleString()} elements.`
  }).refine((arr) => [...new Set(arr)].length === arr.length, {
    message: "Each element of diets must be unique."
  }),
  dishTypes: z.array(z.object({
    id: IdSchema,
    name: z.string({
      required_error: "A name is required."
    })
  })).max(MAX_DISH_TYPES_LENGTH, {
    message: `Recipe cannot have more than ${MAX_DISH_TYPES_LENGTH.toLocaleString()} dish types.`
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
    }).max(MAX_INGREDIENT_AMOUNT, {
      message: `Amount cannot be more than ${MAX_INGREDIENT_AMOUNT.toLocaleString()}.`
    }),
    note: z.string().optional()
  })).min(1, {
    message: "Recipe must contain at least 1 ingredient."
  }).max(MAX_INSTRUCTIONS_LENGTH, {
    message: `Recipe cannot contain more than ${MAX_INSTRUCTIONS_LENGTH.toLocaleString()} instructions.`
  }),
  cuisine: z.object({
    id: IdSchema,
    adjective: z.string({
      required_error: "A cuisine adjective is required."
    }),
    countryOrigins: z.array(z.object({
      country: z.object({
        icon: z.string({
          required_error: "A country icon is required."
        })
      })
    }))
  }).optional(),
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
    }).max(MAX_INSTRUCTION_TIME_AMOUNT, {
      message: `Instruction time cannot exceed ${MAX_INSTRUCTION_TIME_AMOUNT.toLocaleString()}.`
    }),
    description: z.string({
      required_error: "Instruction content is required."
    }).nonempty({
      message: "Description cannot be empty."
    }).max(MAX_INSTRUCTIONS_LENGTH, {
      message: `A maximum of ${MAX_INSTRUCTIONS_LENGTH.toLocaleString()} instructions are allowed.`
    })
  })),
  isPublic: z.boolean()
});

export type RecipeCreation = z.infer<typeof RecipeCreationSchema>;

export const ReviewCreationSchema = z.object({
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

export type ReviewCreation = z.infer<typeof ReviewCreationSchema>;
