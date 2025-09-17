"use client";

import { Input } from "@/components/ui/input";
import { updateUsername } from "@/lib/actions/settings";
import { type ChangeUsernameForm, ChangeUsernameFormSchema } from "@/lib/zod/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Info, LoaderCircle, SquarePen, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
      isValidating
    }
  } = useForm({
    resolver: zodResolver(ChangeUsernameFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { username }
  });
  const currentUsername = useWatch({ control, name: "username" });
  const areNamesEqual = currentUsername === username;

  const { execute, isExecuting } = useAction(updateUsername, {
    onSuccess: async ({ data, input }) => {
      toast.success(data.message);
      await update({ name: input.username });
      refresh();
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });
  
  return (
    <form onSubmit={handleSubmit(execute)} className="grid gap-1.5">
      <h1 className="font-bold text-xl">Username</h1>
      <p className="text-muted-foreground mb-1">Change how others see your username.</p>
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
                disabled={areNamesEqual || isExecuting || isValidating}
                className="mealicious-button flex items-center justify-center font-semibold size-9 rounded-sm"
              >
                {isExecuting || isValidating ? <LoaderCircle size={18} className="animate-spin"/> : <Check size={20} strokeWidth={1.25}/>}
              </button>
              <button
                type="button"
                disabled={isExecuting || isValidating}
                onClick={() => {
                  setEditMode(false);
                  reset();
                }}
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
      <div className="error-text text-xs has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{errors.username?.message}</span>
      </div>
    </form>
  );
}
