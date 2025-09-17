import z from "zod/v4";
import { EmailSchema, PasswordSchema, UsernameSchema } from "@/lib/zod/auth";
import { getMatchingEmail, getMatchingName } from "@/lib/functions/auth";
import { IdSchema, UrlSchema } from "@/lib/zod";

export const maxFileSize = {
  amount: 1024 * 1024,
  label: "1MB"
};

export const MAX_NUTRITION_AMOUNT_LIMIT = 10000;
export const MAX_DIET_SCORE = 5;
export const MAX_DISH_TYPE_SCORE = 5;
export const MAX_CUISINE_SCORE = 5;

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
    abort: true,
    error: `File size must not exceed ${maxFileSize.label}.`
  });

export const ChangeProfilePictureFormSchema = z.object({
  image: ImageSchema
});

export type ChangeProfilePictureForm = z.infer<typeof ChangeProfilePictureFormSchema>;

export const ChangeUsernameFormSchema = z.object({
  username: UsernameSchema.check(async (ctx) => {
    const foundName = await getMatchingName(ctx.value);

    if (foundName) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: "Username is already being used."
      });
    }
  })
});

export type ChangeUsernameForm = z.infer<typeof ChangeUsernameFormSchema>;

export const ChangeEmailFormSchema = z.object({
  email: EmailSchema.check(async (ctx) => {
    const foundEmail = await getMatchingEmail(ctx.value);
    if (foundEmail) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: "Email is already being used."
      });
    }
  })
});

export type ChangeEmailForm = z.infer<typeof ChangeEmailFormSchema>;

export const ChangePasswordFormSchema = z.object({
  currentPassword: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A current password input is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    error: "Current password input cannot be empty."
  }),
  newPassword: PasswordSchema,
  confirmPassword: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A confirm password input is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    error: "Confirm password input cannot be empty."
  })
}).check((ctx) => {
  const { currentPassword, newPassword, confirmPassword } = ctx.value;
  if (currentPassword === newPassword) {
    ctx.issues.push({
      code: "custom",
      input: confirmPassword,
      fatal: true,
      message: "New password cannot be the same as the entered current password.",
      path: ["newPassword"]
    });

    return z.NEVER;
  }
  
  if (newPassword !== confirmPassword) {
    ctx.issues.push({
      code: "custom",
      input: confirmPassword,
      fatal: true,
      message: "Passwords do not match.",
      path: ["confirmPassword"]
    });

    return z.NEVER;
  }
});

export type ChangePasswordForm = z.infer<typeof ChangePasswordFormSchema>;

export const ChangeDietPreferencesFormSchema = z.object({
  preferences: z.array(z.object({
    id: IdSchema,
    name: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A diet name is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Diet name cannot be empty."
    }),
    description: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A description is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Description cannot be empty."
    }),
    score: z.number({
      error: (issue) => typeof issue.input === "undefined"
        ? "A diet score is required."
        : "Expected a number, but received an invalid type."
    }).int({
      abort: true,
      error: "Diet score must be an integer."
    }).nonnegative({
      abort: true,
      error: "Diet score cannot be negative."
    }).max(MAX_DIET_SCORE, {
      abort: true,
      error: `Diet score cannot be more than ${MAX_DIET_SCORE.toLocaleString()}.`
    })
  }))
});

export type ChangeDietPreferencesForm = z.infer<typeof ChangeDietPreferencesFormSchema>;

export const ChangeDishTypePreferencesFormSchema = z.object({
  preferences: z.array(z.object({
    id: IdSchema,
    name: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A dish type name is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Diet name cannot be empty."
    }),
    description: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A description is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Description cannot be empty."
    }),
    score: z.number({
      error: (issue) => typeof issue.input === "undefined"
        ? "A diet score is required."
        : "Expected a number, but received an invalid type."
    }).int({
      abort: true,
      error: "Diet score must be an integer."
    }).nonnegative({
      abort: true,
      error: "Dish type score cannot be negative."
    }).max(MAX_DISH_TYPE_SCORE, {
      abort: true,
      error: `Diet score cannot be more than ${MAX_DISH_TYPE_SCORE.toLocaleString()}.`
    })
  }))
});

export type ChangeDishTypePreferencesForm = z.infer<typeof ChangeDishTypePreferencesFormSchema>;

export const ChangeCuisinePreferencesFormSchema = z.object({
  preferences: z.array(z.object({
    id: IdSchema,
    icon: UrlSchema,
    adjective: z.string({
      error: (issue) => typeof issue.input === "undefined"
        ? "A cuisine adjective is required."
        : "Expected a string, but received an invalid type."
    }).nonempty({
      error: "Adjective cannot be empty."
    }),
    description: z.string({
      error: "A description is required."
    }).nonempty({
      error: "Description cannot be empty."
    }),
    score: z.number({
      error: (issue) => typeof issue.input === "undefined"
        ? "A cuisine score is required."
        : "Expected a number, but received an invalid type."
    }).int({
      abort: true,
      error: "Cuisine score must be an integer."
    }).min(1, {
      abort: true,
      error: "Cuisine score must be at least 1."
    }).max(MAX_CUISINE_SCORE, {
      abort: true,
      error: `Cuisine score cannot be more than ${MAX_CUISINE_SCORE.toLocaleString()}.`
    })
  }))
});

export type ChangeCuisinePreferencesForm = z.infer<typeof ChangeCuisinePreferencesFormSchema>;
