import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/auth";

export const actionClient = createSafeActionClient({
  handleServerError: (error) => {
    return error.message || "Something went wrong.";
  }
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth();
  if (!session?.user) throw new Error("User was not found!");

  return next({
    ctx: {
      session,
      user: session.user
    }
  });
});
