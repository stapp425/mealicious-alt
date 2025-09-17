"use client";

import { ChangePasswordFormSchema, type ChangePasswordForm } from "@/lib/zod/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Info, LoaderCircle, SquarePen } from "lucide-react";
import PasswordInput from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { useAction } from "next-safe-action/hooks";
import { updatePassword } from "@/lib/actions/settings";
import { toast } from "sonner";

type ChangePasswordFormProps = {
  canEdit: boolean;
};

export default function ChangePasswordForm({ canEdit }: ChangePasswordFormProps) {
  const [editMode, setEditMode] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors
    }
  } = useForm({
    resolver: zodResolver(ChangePasswordFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit"
  });

  const { execute, isExecuting } = useAction(updatePassword, {
    onSuccess: ({ data }) => {
      reset();
      setEditMode(false);
      toast.success(data.message);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });
  
  return (
    <form onSubmit={handleSubmit(execute)} className="grid gap-1.5">
      <h1 className="font-bold text-xl">Password</h1>
      <p className="text-muted-foreground mb-1">Change your current password here.</p>
      {
        editMode ? (
          <div className="grid gap-2.5">
            <div className="error-text text-xs has-[>span:empty]:hidden">
              <Info size={14}/>
              <span>{errors.currentPassword?.message}</span>
            </div>
            <PasswordInput
              id="current-password"
              {...register("currentPassword")}
              placeholder="Current Password"
              className="shadow-none rounded-sm"
            />
            <div className="error-text text-xs has-[>span:empty]:hidden">
              <Info size={14}/>
              <span>{errors.newPassword?.message}</span>
            </div>
            <PasswordInput
              id="new-password"
              {...register("newPassword")}
              placeholder="New Password"
              className="shadow-none rounded-sm"
            />
            <div className="error-text text-xs has-[>span:empty]:hidden">
              <Info size={14}/>
              <span>{errors.confirmPassword?.message}</span>
            </div>
            <PasswordInput
              id="confirm-password"
              {...register("confirmPassword")}
              placeholder="Confirm Password"
              className="shadow-none rounded-sm"
            />
            <div className="w-fit flex items-center gap-2.5">
              <button 
                type="submit"
                disabled={isExecuting}
                className="w-18 h-full mealicious-button text-sm flex justify-center items-center font-semibold py-2 px-4 rounded-sm"
              >
                {isExecuting ? <LoaderCircle size={18} className="animate-spin"/> : "Enter"}
              </button>
              <Button 
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditMode(false);
                  reset();
                }}
                className="cursor-pointer rounded-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
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
