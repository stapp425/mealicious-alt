"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Control, FormState, useForm, UseFormRegister, UseFormSetValue, UseFormTrigger } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResetPasswordForm, ResetPasswordFormSchema } from "@/lib/zod/auth";
import { ChevronRight, CirclePlus, Mail, ShieldCheck } from "lucide-react";
import { EmailSection, NewPasswordSection, OTPSection } from "@/components/auth/forgot-password-sections";
import { resetPassword } from "@/lib/actions/auth";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

const formSections = ["email", "otp", "password"] as const;
type FormSection = typeof formSections[number];

export type FormSectionProps = {
  loading: boolean;
  control: Control<ResetPasswordForm>;
  register: UseFormRegister<ResetPasswordForm>;
  trigger: UseFormTrigger<ResetPasswordForm>;
  setValue: UseFormSetValue<ResetPasswordForm>;
  formState: FormState<ResetPasswordForm>;
  next: (condition: () => boolean | Promise<boolean>) => void;
};

type FormStep = {
  id: FormSection;
  label: string;
  icon: typeof Mail;
  Component: React.FC<FormSectionProps>;
};

const formSteps: FormStep[] = [
  {
    id: "email",
    label: "Email",
    icon: Mail,
    Component: EmailSection
  },
  {
    id: "otp",
    label: "OTP",
    icon: ShieldCheck,
    Component: (props) => <OTPSection codeLength={6} {...props}/>
  },
  {
    id: "password",
    label: "Password",
    icon: CirclePlus,
    Component: NewPasswordSection
  }
];

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const ActiveSection = formSteps[sectionIndex];

  const {
    control,
    register,
    reset,
    setValue,
    trigger,
    handleSubmit,
    formState
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(ResetPasswordFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit"
  });

  const { executeAsync } = useAction(resetPassword, {
    onSuccess: ({ data }) => {
      setOpen(false);
      if (!data) return;
      toast.success("Password successfully reset!");
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const next = useCallback(async (condition: () => boolean | Promise<boolean>) => {
    setLoading(true);
    const validationResult = await condition();
    if (validationResult && sectionIndex < formSteps.length) setSectionIndex((i) => i + 1);
    setLoading(false);
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    await executeAsync(data);
  });

  useEffect(() => {
    if (!open) {
      setSectionIndex(0);
      reset();
    }
  }, [open]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="cursor-pointer text-mealicious-primary hover:text-mealicious-primary-hover">Forgot Password?</DialogTrigger>
      <DialogContent 
        onPointerDownOutside={(e) => e.preventDefault()}
        className="grid gap-6"
      >
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              Forgot your password? This dialog helps in assisting users in resetting their passwords, given that they have a verified account.
            </DialogDescription>
          </DialogHeader>
        </VisuallyHidden>
        <form onSubmit={onSubmit}>
          <ActiveSection.Component
            loading={loading}
            control={control}
            trigger={trigger}
            register={register}
            setValue={setValue}
            formState={formState}
            next={next}
          />
        </form>
        <div className="flex justify-center items-center gap-8">
          {
            formSteps.map((s) => (
              <Slot key={s.label}>
                <>
                <div
                  key={s.label}
                  className={cn(
                    formSections[sectionIndex] === s.id ? "text-mealicious-primary" : "text-muted-foreground",
                    "text-xs sm:text-sm text-center font-semibold flex flex-col items-center gap-2"
                  )}
                >
                  <s.icon size={18}/>
                  {s.label}
                </div>
                <ChevronRight size={18} className="last:hidden stroke-muted-foreground"/>
                </>
              </Slot>
            ))
          }
        </div>
      </DialogContent>
    </Dialog>
  );
}
