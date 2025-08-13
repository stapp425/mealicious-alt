import z from "zod/v4";
import { getMatchingEmail, getMatchingName } from "@/lib/functions/auth";
import { comparePasswordResetOTPValues, compareValues, getMatchingUserInfo } from "@/lib/functions/verification";

export const UsernameSchema = z.string({
  error: (issue) => typeof issue.input === "undefined"
    ? "A username is required."
    : "Expected a string, but received an invalid type."
}).min(6, {
  abort: true,
  error: "Username must have at least 6 characters."
}).max(20, {
  abort: true,
  error: "Username cannot have more than 20 characters."
}).regex(/^[^_].*[^_]$/, {
  abort: true,
  error: "Username cannot start or end with an _."
}).regex(/^[^\W]+$/, {
  error: "Username cannot contain whitespace or symbols."
});

export const PasswordSchema = z.string({
  error: (issue) => typeof issue.input === "undefined"
    ? "A password is required."
    : "Expected a string, but received an invalid type."
}).min(12, {
  abort: true,
  error: "Password must have at least 12 characters."
}).max(20, {
  abort: true,
  error: "Password cannot have more than 20 characters."
}).regex(/^.*[A-Z].*$/, {
  abort: true,
  message: "Password must contain at least one uppercase letter."
}).regex(/^.*[_\W].*$/, {
  abort: true,
  message: "Password must contain at least one symbol."
}).regex(/^.*[0-9]+.*$/, {
  abort: true,
  message: "Password must contain at least one digit."
});

export const EmailSchema = z.email({
  error: (issue) => issue.code === "invalid_format"
    ? "Input does not match an email format."
    : "Expected a string, but received an invalid type."
}).nonempty({
  error: "Email cannot be left empty."
});

export const SignInFormSchema = z.object({
  email: EmailSchema.transform((val) => val.toLowerCase()),
  password: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A password is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    error: "Password cannot be empty."
  })
});

export type SignInForm = z.infer<typeof SignInFormSchema>;

export const SignUpFormSchema = z.object({
  name: UsernameSchema,
  email: EmailSchema.transform((val) => val.toLowerCase()),
  password: PasswordSchema,
  confirmPassword: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A confirm password input is required."
      : "Expected a string, but received an invalid type."
  })
}).check(async (ctx) => {
    const { name, email, password, confirmPassword } = ctx.value;
    const [foundUserWithName, foundUserWithEmail] = await Promise.all([getMatchingName(name), getMatchingEmail(email)]);
    
    if (password !== confirmPassword) {
      ctx.issues.push({
        code: "custom",
        input: confirmPassword,
        message: "Passwords do not match.",
        path: ["confirmPassword"]
      });
    }

    if (foundUserWithName) {
      ctx.issues.push({
        code: "custom",
        input: name,
        message: "Username already in use.",
        path: ["name"]
      });
    }
    
    if (foundUserWithEmail) {
      ctx.issues.push({
        code: "custom",
        input: email,
        message: "Email already in use.",
        path: ["email"]
      });
    }
  });

export type SignUpForm = z.infer<typeof SignUpFormSchema>;

export const CredentialsSchema = z.object({
  email: EmailSchema,
  password: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A password is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    error: "Password cannot be empty."
  })
});

export type Credentials = z.infer<typeof CredentialsSchema>;

export const EmailVerificationFormSchema = z.object({
  email: EmailSchema,
  code: z.string({
    error: "A verification code is required."
  }).nonempty({
    message: "Verification code cannot be negative."
  })
});

export type EmailVerificationForm = z.infer<typeof EmailVerificationFormSchema>;

export const ResetPasswordFormSchema = z.object({
  email: EmailSchema,
  code: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A verification code is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    error: "Verification code cannot be empty."
  }),
  password: PasswordSchema,
  confirmPassword: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A confirm password input is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    error: "Confirm password input cannot be empty."
  })
}).check(async (ctx) => {
  const { email, code, password, confirmPassword } = ctx.value;
  
  const foundUser = await getMatchingUserInfo(email);
  if (!foundUser) {
    ctx.issues.push({
      code: "custom",
      fatal: true,
      input: email,
      message: "Email does not exist.",
      path: ["email"]
    });

    return z.NEVER;
  }

  if (!foundUser.password) {
    ctx.issues.push({
      code: "custom",
      fatal: true,
      input: password,
      message: "This user is ineligible for a password reset.",
      path: ["email"]
    });

    return z.NEVER;
  }

  const compareCodeResult = await comparePasswordResetOTPValues({ email, code });
  if (!compareCodeResult) {
    ctx.issues.push({
      code: "custom",
      fatal: true,
      input: code,
      message: "Code does not match.",
      path: ["code"]
    });

    return z.NEVER;
  }

  if (password !== confirmPassword) {
    ctx.issues.push({
      code: "custom",
      fatal: true,
      input: confirmPassword,
      message: "Passwords do not match.",
      path: ["confirmPassword"]
    });

    return z.NEVER;
  }

  const passwordCompareResult = await compareValues(password, foundUser.password);
  if (passwordCompareResult) {
    ctx.issues.push({
      code: "custom",
      fatal: true,
      input: password,
      message: "New password matches the old password.",
      path: ["password"]
    });

    return z.NEVER;
  }
});

export type ResetPasswordForm = z.infer<typeof ResetPasswordFormSchema>;

export const ReCaptchaResultSchema = z.object({
  data: z.discriminatedUnion("success", [
    z.object({
      success: z.literal(true),
      score: z.number({
        error: (issue) => typeof issue.input === "undefined"
          ? "A score is required."
          : "Expected a number, but received an invalid type."
      }).nonnegative({
        abort: true,
        error: "Score cannot be negative."
      }).max(1, {
        error: "Score cannot be more than 1."
      }),
      challenge_ts: z.iso.datetime({
        error: (issue) => issue.code === "invalid_format"
          ? "Format of input does not match the date time standard format."
          : "Expected a string, but received an invalid type."
      }),
      hostname: z.string({
        error: (issue) => typeof issue.input === "undefined"
          ? "A hostname is required."
          : "Expected a string, but received an invalid type."
      }),
      action: z.optional(z.string({
        error: (issue) => typeof issue.input === "undefined"
          ? "An action string is required."
          : "Expected a string, but received an invalid type."
      })),
    }),
    z.object({
      success: z.literal(false),
      "error-codes": z.array(
        z.enum([
          "missing-input-secret",
          "invalid-input-secret",
          "missing-input-response",
          "invalid-input-response",
          "bad-request",
          "timeout-or-duplicate"
        ]),
        "Expected an array, but received an invalid type."
      )
    })
  ])
}).transform((val) => val.data);

export type ReCaptchaResult = z.infer<typeof ReCaptchaResultSchema>;
