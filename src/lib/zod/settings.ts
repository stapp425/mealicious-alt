import z from "zod";
import { PasswordSchema } from "@/lib/zod/auth";

export const ChangePasswordSchema = z.object({
  password: PasswordSchema
});
