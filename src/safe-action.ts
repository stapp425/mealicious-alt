import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/auth";
import { ActionError } from "@/lib/types";

export const actionClient = createSafeActionClient({
  handleServerError: (error) => {
    if (error instanceof ActionError) return error.message;
    console.log(error.message);
    return "There was an internal server error.";
  }
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth();
  if (!session?.user) throw new ActionError("User was not found!");
  const user = session.user;
  if (!user.id || !user.email || !user.name || user.image === undefined) throw new ActionError("Malformed user information detected.");

  return next({
    ctx: {
      session,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      }
    }
  });
});
