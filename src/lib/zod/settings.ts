import z from "zod";
import { EmailSchema, PasswordSchema, UsernameSchema } from "@/lib/zod/auth";
import { getMatchingEmail, getMatchingName } from "@/lib/functions/auth";
import { IdSchema, UnitSchema } from "@/lib/zod";

export const maxFileSize = {
  amount: 1024 * 1024,
  label: "1MB"
};

export const MAX_NUTRITION_AMOUNT_LIMIT = 10000;
export const MAX_DIET_SCORE = 5;
export const MAX_DISH_TYPE_SCORE = 5;
export const MAX_CUISINE_SCORE = 5;

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

export const ChangeProfilePictureFormSchema = z.object({
  image: ImageSchema
});

export type ChangeProfilePictureForm = z.infer<typeof ChangeProfilePictureFormSchema>;

export const ChangeUsernameFormSchema = z.object({
  username: UsernameSchema.superRefine(async (val, ctx) => {
    const foundName = await getMatchingName(val);

    if (foundName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        fatal: true,
        message: "Username is already being used."
      });

      return z.NEVER;
    }
  })
});

export type ChangeUsernameForm = z.infer<typeof ChangeUsernameFormSchema>;

export const ChangeEmailFormSchema = z.object({
  email: EmailSchema.superRefine(async (val, ctx) => {
    const foundEmail = await getMatchingEmail(val);

    if (foundEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        fatal: true,
        message: "Email is already being used."
      });

      return z.NEVER;
    }
  })
});

export type ChangeEmailForm = z.infer<typeof ChangeEmailFormSchema>;

export const ChangePasswordFormSchema = z.object({
  currentPassword: z.string({
    required_error: "A current password input is required."
  }).nonempty({
    message: "Current password input cannot be empty."
  }),
  newPassword: PasswordSchema,
  confirmPassword: z.string({
    required_error: "A confirm password input is required."
  }).nonempty({
    message: "Confirm password input cannot be empty."
  })
}).superRefine(async (val, ctx) => {
  if (val.currentPassword === val.newPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      fatal: true,
      message: "New password cannot be the same as the entered current password.",
      path: ["newPassword"]
    });

    return z.NEVER;
  }
  
  if (val.newPassword !== val.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      fatal: true,
      message: "Passwords do not match.",
      path: ["confirmPassword"]
    });

    return z.NEVER;
  }
});

export type ChangePasswordForm = z.infer<typeof ChangePasswordFormSchema>;

export const ChangeNutritionPreferencesFormSchema = z.object({
  preferences: z.array(z.object({
    id: IdSchema,
    description: z.string({
      required_error: "A description is required."
    }).nonempty({
      message: "Description cannot be empty."
    }),
    name: z.string({
      required_error: "A nutrition name is required."
    }).nonempty({
      message: "Nutrition name cannot be empty."
    }),
    unit: UnitSchema,
    allowedUnits: z.array(UnitSchema),
    amountLimit: z.number({
      required_error: "An amount limit is required."
    }).int({
      message: "Amount must be an integer."
    }).nonnegative({
      message: "Amount limit cannot be negative."
    }).max(MAX_NUTRITION_AMOUNT_LIMIT, {
      message: `Amount limit cannot be more than ${MAX_NUTRITION_AMOUNT_LIMIT.toLocaleString()}.`
    })
  }))
});

export type ChangeNutritionPreferencesForm = z.infer<typeof ChangeNutritionPreferencesFormSchema>;

export const ChangeDietPreferencesFormSchema = z.object({
  preferences: z.array(z.object({
    id: IdSchema,
    name: z.string({
      required_error: "A diet name is required."
    }).nonempty({
      message: "Diet name cannot be empty."
    }),
    description: z.string({
      required_error: "A description is required."
    }).nonempty({
      message: "Description cannot be empty."
    }),
    score: z.number({
      required_error: "A diet score is required."
    }).int({
      message: "Diet score must be an integer."
    }).nonnegative({
      message: "Diet score cannot be negative."
    }).max(MAX_DIET_SCORE, {
      message: `Diet score cannot be more than ${MAX_DIET_SCORE.toLocaleString()}.`
    })
  }))
});

export type ChangeDietPreferencesForm = z.infer<typeof ChangeDietPreferencesFormSchema>;

export const ChangeDishTypePreferencesFormSchema = z.object({
  preferences: z.array(z.object({
    id: IdSchema,
    name: z.string({
      required_error: "A diet name is required."
    }).nonempty({
      message: "Diet name cannot be empty."
    }),
    description: z.string({
      required_error: "A description is required."
    }).nonempty({
      message: "Description cannot be empty."
    }),
    score: z.number({
      required_error: "A diet score is required."
    }).int({
      message: "Diet score must be an integer."
    }).nonnegative({
      message: "Dish type score cannot be negative."
    }).max(MAX_DISH_TYPE_SCORE, {
      message: `Diet score cannot be more than ${MAX_DISH_TYPE_SCORE.toLocaleString()}.`
    })
  }))
});

export type ChangeDishTypePreferencesForm = z.infer<typeof ChangeDishTypePreferencesFormSchema>;

export const ChangeCuisinePreferencesFormSchema = z.object({
  preferences: z.array(z.object({
    id: IdSchema,
    icon: z.string({
      required_error: "A cuisine icon is required."
    }).url({
      message: "Cuisine icon URL must be in a valid URL format."
    }),
    adjective: z.string({
      required_error: "A cuisine adjective is required."
    }).nonempty({
      message: "Adjective cannot be empty."
    }),
    description: z.string({
      required_error: "A description is required."
    }).nonempty({
      message: "Description cannot be empty."
    }),
    score: z.number({
      required_error: "A cuisine score is required."
    }).int({
      message: "Cuisine score must be an integer."
    }).min(1, {
      message: "Cuisine score must be at least 1."
    }).max(MAX_CUISINE_SCORE, {
      message: `Cuisine score cannot be more than ${MAX_CUISINE_SCORE.toLocaleString()}.`
    })
  }))
});

export type ChangeCuisinePreferencesForm = z.infer<typeof ChangeCuisinePreferencesFormSchema>;
