"use client";

import { ChangePasswordFormSchema, type ChangePasswordForm } from "@/lib/zod/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { LoaderCircle, SquarePen } from "lucide-react";
import PasswordInput from "@/components/auth/password-input";
import { Button } from "../../ui/button";
import { useAction } from "next-safe-action/hooks";
import { updatePassword } from "@/lib/actions/settings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ChangePasswordFormProps = {
  canEdit: boolean;
};

export default function ChangePasswordForm({ canEdit }: ChangePasswordFormProps) {
  const { refresh } = useRouter();
  const [editMode, setEditMode] = useState(false);
  const {
    register,
    handleSubmit,
    formState: {
      isSubmitting,
      errors
    }
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(ChangePasswordFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit"
  });

  const { executeAsync } = useAction(updatePassword, {
    onSuccess: ({ data }) => {
      if (!data) return;
      toast.success(data.message);
      refresh();
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const onSubmit = handleSubmit(async (data) => {
    await executeAsync(data);
  });
  
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1.5">
      <h1 className="font-bold text-xl">Password</h1>
      <p className="text-muted-foreground mb-1">Change your current password here.</p>
      {
        editMode ? (
          <div className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              {
                errors.currentPassword?.message && (
                  <div className="flex items-center gap-1.5 text-red-500 text-xs">
                    {errors.currentPassword.message}
                  </div>
                )
              }
              <PasswordInput
                id="current-password"
                {...register("currentPassword")}
                placeholder="Current Password"
                className="shadow-none rounded-sm"
              />
            </div>
            <div className="grid gap-1.5">
              {
                errors.newPassword?.message && (
                  <div className="flex items-center gap-1.5 text-red-500 text-xs">
                    {errors.newPassword.message}
                  </div>
                )
              }
              <PasswordInput
                id="new-password"
                {...register("newPassword")}
                placeholder="New Password"
                className="shadow-none rounded-sm"
              />
            </div>
            <div className="grid gap-1.5">
              {
                errors.confirmPassword?.message && (
                  <div className="flex items-center gap-1.5 text-red-500 text-xs">
                    {errors.confirmPassword.message}
                  </div>
                )
              }
              <PasswordInput
                id="confirm-password"
                {...register("confirmPassword")}
                placeholder="Confirm Password"
                className="shadow-none rounded-sm"
              />
            </div>
            <div className="w-fit flex items-center gap-4 ml-auto">
              <Button 
                type="button"
                variant="secondary"
                onClick={() => setEditMode(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-18 h-full mealicious-button text-sm flex justify-center items-center font-semibold py-2 px-4 rounded-md"
              >
                {isSubmitting ? <LoaderCircle size={18} className="animate-spin"/> : "Enter"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Input 
              type="password"
              disabled
              defaultValue="*************"
              placeholder="Email"
              className="flex-1 shadow-none rounded-sm"
            />
            {
              canEdit && (
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
        )
      }
    </form>
  );
}