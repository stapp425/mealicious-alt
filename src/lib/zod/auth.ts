import z from "zod";
import { getMatchingEmail, getMatchingName } from "@/lib/functions/auth";

export const UsernameSchema = z.string({
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

export const PasswordSchema = z.string({
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

export const EmailSchema = z.string({
  required_error: "An e-mail is required.",
}).email({
  message: "Input does not match a valid e-mail format."
});

export const SignInFormSchema = z.object({
  email: EmailSchema,
  password: z.string({
    message: "A password is required."
  }).nonempty({
    message: "Password cannot be empty."
  })
});

export type SignInForm = z.infer<typeof SignInFormSchema>;

export const SignUpFormSchema = z.object({
  name: UsernameSchema,
  email: EmailSchema,
  password: PasswordSchema,
  confirmPassword: z.string()
}).superRefine(async (val, ctx) => {
    const [foundUserWithName, foundUserWithEmail] = await Promise.all([getMatchingName(val.name), getMatchingEmail(val.email)]);
    
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"]
      });
    }

    if (foundUserWithName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Username already exists.",
        path: ["name"]
      });
    }
    
    if (foundUserWithEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email already exists.",
        path: ["email"]
      });
    }
  });

export type SignUpForm = z.infer<typeof SignUpFormSchema>;

export const CredentialsSchema = z.object({
  email: z.string({
    required_error: "An email is required."
  }).email({
    message: "Email must be in the valid format."
  }),
  password: z.string({
    required_error: "A password is required."
  }).nonempty({
    message: "Password cannot be empty."
  })
});

export type Credentials = z.infer<typeof CredentialsSchema>;

export const EmailVerificationFormSchema = z.object({
  email: EmailSchema,
  code: z.string({
    required_error: "A verification code is required."
  }).nonempty({
    message: "Verification code cannot be negative."
  })
});

export type EmailVerificationForm = z.infer<typeof EmailVerificationFormSchema>;

export const ResetPasswordFormSchema = z.object({
  email: EmailSchema,
  code: z.string({
    required_error: "A verification code is required."
  }).nonempty({
    message: "Verification code cannot be negative."
  }),
  password: PasswordSchema,
  confirmPassword: z.string({
    required_error: "A confirm password input is required."
  }).nonempty({
    message: "Confirm password input cannot be empty."
  })
}).superRefine(async (val, ctx) => {
  if (val.password !== val.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match.",
      path: ["confirmPassword"]
    });
  }
});

export type ResetPasswordForm = z.infer<typeof ResetPasswordFormSchema>;
