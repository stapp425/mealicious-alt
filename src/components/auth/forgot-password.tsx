"use client";

import React, { JSX, useCallback, useEffect, useState } from "react";
import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Control, useForm, UseFormRegister, UseFormSetValue, useFormState, UseFormTrigger, UseFormWatch, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResetPasswordForm, ResetPasswordFormSchema } from "@/lib/zod/auth";
import { ChevronRight, CirclePlus, LoaderCircle, LucideProps, Mail, ShieldCheck } from "lucide-react";
import { resetPassword, verifyCaptcha } from "@/lib/actions/auth";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { comparePasswordResetOTPValues, generatePasswordResetPrompt, getMatchingUserInfo } from "@/lib/functions/verification";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/auth/password-input";

const formSections = ["email", "otp", "password"] as const;
type FormSection = typeof formSections[number];

type FormSectionProps<T extends ResetPasswordForm = ResetPasswordForm> = {
  loading: boolean;
  next: (condition: () => boolean | Promise<boolean>) => void;
  control: Control<T>;
  register: UseFormRegister<T>;
  trigger: UseFormTrigger<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
};

type FormStep = {
  id: FormSection;
  label: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  Component: (props: FormSectionProps) => JSX.Element;
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
    watch,
    formState: { isSubmitting }
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(ResetPasswordFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit"
  });

  const { executeAsync } = useAction(resetPassword, {
    onSuccess: () => {
      setOpen(false);
      toast.success("Password successfully reset!");
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const next = useCallback(async (condition: () => boolean | Promise<boolean>) => {
    setLoading(true);
    const validationResult = await condition();
    if (validationResult && sectionIndex < formSteps.length) setSectionIndex((i) => i + 1);
    setLoading(false);
  }, [setLoading, sectionIndex, setSectionIndex]);

  useEffect(() => {
    if (!open) {
      setSectionIndex(0);
      reset();
    }
  }, [open, setSectionIndex, reset]);
  
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
        <form onSubmit={handleSubmit(async (data) => await executeAsync(data))}>
          <ActiveSection.Component
            loading={loading || isSubmitting}
            next={next}
            control={control}
            register={register}
            setValue={setValue}
            trigger={trigger}
            watch={watch}
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

function EmailSection({
  loading,
  next,
  control,
  register,
  trigger,
  watch
}: FormSectionProps) {
  const { executeRecaptcha: executeReCaptcha } = useGoogleReCaptcha();
  const {
    errors: {
      email: emailError
    }
  } = useFormState({ control, name: "email", exact: true });

  const verifyEmail = useCallback(async () => {
    if (!executeReCaptcha) {
      toast.error("reCaptcha is not available. Please try again later.");
      return false;
    }

    const token = await executeReCaptcha();
    const reCaptchaVerificationResult = await verifyCaptcha(token);

    if (!reCaptchaVerificationResult?.data) {
      toast.error(reCaptchaVerificationResult.serverError);
      return false;
    }
    
    const result = await trigger("email");
    if (!result) return false;

    const foundUser = await getMatchingUserInfo(watch("email"));
    if (!foundUser) {
      toast.error("User does not exist.");
      return false;
    }
  
    if (!foundUser.password) {
      toast.error("This user is ineligible for a password reset.");
      return false;
    }
    
    if (!foundUser.emailVerified) {
      toast.error("This user is not verified yet.");
      return false;
    }
    
    await generatePasswordResetPrompt({ email: watch("email") });
    toast.success("Password reset prompt successfully created!");

    return true;
  }, [executeReCaptcha, trigger, watch]);

  useEffect(() => {
    if (emailError?.message) toast.error(emailError.message);
  }, [emailError?.message]);
  
  return (
    <div className="grid gap-2.5">
      <h1 className="font-bold text-lg">Forgot Password?</h1>
      <p className="text-sm text-muted-foreground">
        No worries, just enter an existing email address associated with an account into the text box below.
      </p>
      <Input 
        type="email"
        {...register("email")}
        autoComplete="email"
        placeholder="Email Address"
        className="shadow-none mb-1 rounded-sm"
      />
      <div className="flex items-center gap-3">
        <DialogClose asChild>
          <Button 
            type="button"
            variant="secondary"
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </DialogClose>
        <button 
          type="button"
          onClick={() => next(verifyEmail)}
          disabled={loading}
          className="w-18 h-full mealicious-button text-sm flex justify-center items-center font-semibold py-2 px-4 rounded-md"
        >
          {loading ? <LoaderCircle size={18} className="animate-spin"/> : "Enter"}
        </button>
      </div>
    </div>
  );
};

function OTPSection({
  loading,
  next,
  control,
  setValue,
  codeLength = 6
}: FormSectionProps & { codeLength?: number; }) {
  const [resendLoading, setResendLoading] = useState(false);
  const [email, code] = useWatch({ control, name: ["email", "code"] });
  
  return (
    <div className="grid gap-2.5">
      <h1 className="font-bold text-xl">Almost There!</h1>
      <p className="text-sm text-muted-foreground">
        Email verification successful! Before resetting the password, we need to verify that you have access to this email. We sent a verification code to <b className="font-semibold text-accent-foreground">{email}</b>.
      </p>
      <InputOTP
        value={code}
        onChange={(val) => setValue("code", val)}
        maxLength={codeLength}
        autoComplete="one-time-code"
        pattern={REGEXP_ONLY_DIGITS}
        spellCheck={false}
      >
        <InputOTPGroup className="w-full flex items-center mx-auto">
          {
            Array.from({ length: codeLength }, (_, i) => i).map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="flex-1 font-bold h-12"
              />
            ))
          }
        </InputOTPGroup>
      </InputOTP>
      <div className="h-7 text-muted-foreground flex items-center gap-2.5">
        <span className="font-semibold">Didn&apos;t get a code?</span>
        <Separator orientation="vertical"/>
        <Button
          type="button"
          variant="link"
          disabled={resendLoading || loading}
          className="cursor-pointer text-mealicious-primary p-0!"
          onClick={async () => {
            setResendLoading(true);
            await generatePasswordResetPrompt({ email, codeLength });
            setResendLoading(false);
            toast.success("Verification code sent!");
          }}
        >
          Resend OTP
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <DialogClose asChild>
          <Button 
            type="button"
            variant="secondary"
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </DialogClose>
        <button 
          type="button"
          onClick={() => next(async () => {
            const compareResult = await comparePasswordResetOTPValues({ email, code });
            if (!compareResult) {
              toast.error("Verification failed. Try entering the code again or resend another code.");
              return false;
            }
            
            toast.success("Verification successful!");
            return true;
          })}
          disabled={loading || resendLoading}
          className="w-18 h-full mealicious-button text-sm flex justify-center items-center font-semibold py-2 px-4 rounded-md"
        >
          {loading ? <LoaderCircle size={18} className="animate-spin"/> : "Enter"}
        </button>
      </div>
    </div>
  );
};

function NewPasswordSection({ control, register }: FormSectionProps) {
  const {
    isSubmitting,
    errors: {
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    }
  } = useFormState({ control, name: "email" });
  return (
    <div className="grid gap-2.5">
      <h1 className="font-bold text-lg">Create a New Password</h1>
      <p className="text-sm text-muted-foreground">
        Now, enter a brand new password that is different from the previous password.
      </p>
      {
        emailError?.message && (
          <div className="flex items-center gap-1.5 text-red-500 text-xs">
            {emailError.message}
          </div>
        )
      }
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-0.5 justify-between">
          <Label
            htmlFor="forgot-password-input"
            className="text-foreground required-field"
          >
            Password
          </Label>
          { 
            passwordError?.message && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs">
                {passwordError.message}
              </div>
            )
          }
        </div>
        <PasswordInput
          id="forgot-password-input"
          {...register("password")}
          autoComplete="new-password"
          className="shadow-none rounded-sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-0.5 justify-between">
          <Label
            htmlFor="forgot-password-confirm-input"
            className="text-foreground required-field"
          >
            Confirm Password
          </Label>
          { 
            confirmPasswordError?.message && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs">
                {confirmPasswordError.message}
              </div>
            )
          }
        </div>
        <PasswordInput
          id="forgot-password-confirm-input"
          {...register("confirmPassword")}
          placeholder="Confirm Password"
          autoComplete="off"
          className="shadow-none rounded-sm"
        />
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <DialogClose asChild>
          <Button 
            type="button"
            variant="secondary"
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </DialogClose>
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-18 h-full mealicious-button text-sm flex justify-center items-center font-semibold py-2 px-4 rounded-md"
        >
          {isSubmitting ? <LoaderCircle size={18} className="animate-spin"/> : "Enter"}
        </button>
      </div>
    </div>
  );
}
