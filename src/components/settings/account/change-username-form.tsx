"use client";

import { Input } from "@/components/ui/input";
import { updateUsername } from "@/lib/actions/settings";
import { type ChangeUsernameForm, ChangeUsernameFormSchema } from "@/lib/zod/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LoaderCircle, SquarePen, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

type ChangeUsernameFormProps = {
  username: string;
};

export function ChangeUsernameForm({ username }: ChangeUsernameFormProps) {
  const { update } = useSession();
  const { refresh } = useRouter();
  const [editMode, setEditMode] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
      isValidating
    }
  } = useForm<ChangeUsernameForm>({
    resolver: zodResolver(ChangeUsernameFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { username }
  });
  const currentUsername = useWatch({ control, name: "username" });
  const areNamesEqual = currentUsername === username;

  const { executeAsync } = useAction(updateUsername, {
    onSuccess: async ({ data, input }) => {
      if (!data) return;
      toast.success(data.message);
      await update({ name: input.username });
      refresh();
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const onSubmit = handleSubmit(async (data) => {
    await executeAsync(data);
  });

  useEffect(() => {
    if (!editMode) reset();
  }, [editMode, reset]);
  
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1.5">
      <h1 className="font-bold text-xl">Username</h1>
      <p className="text-muted-foreground mb-1">Change how others see your username.</p>
      {
        errors.username?.message && (
          <div className="flex items-center gap-1.5 text-red-500 text-xs">
            {errors.username.message}
          </div>
        )
      }
      <div className="flex items-center gap-3">
        <Input 
          disabled={!editMode}
          placeholder="Username"
          {...register("username")}
          className="flex-1 shadow-none rounded-sm"
        />
        <div className="ml-auto flex items-center gap-3">
          {
            editMode ? (
              <>
              <button
                type="submit"
                disabled={areNamesEqual || isSubmitting || isValidating}
                className="mealicious-button flex items-center justify-center font-semibold size-9 rounded-sm"
              >
                {isSubmitting || isValidating ? <LoaderCircle size={18} className="animate-spin"/> : <Check size={20} strokeWidth={1.25}/>}
              </button>
              <button
                type="button"
                disabled={isSubmitting || isValidating}
                onClick={() => setEditMode(false)}
                className="mealicious-button flex items-center justify-center font-semibold size-9 rounded-sm"
              >
                <X size={20} strokeWidth={1.25}/>
              </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="mealicious-button flex items-center justify-center font-semibold size-9 rounded-sm"
              >
                <SquarePen
                  size={20}
                  strokeWidth={1.25}
                />
              </button>
            )
          }
        </div>
      </div>
    </form>
  );
}
