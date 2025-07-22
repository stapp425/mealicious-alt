"use client";

import { DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSectionProps } from "@/components/auth/forgot-password";
import { LoaderCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { comparePasswordResetOTPValues, generatePasswordResetPrompt } from "@/lib/functions/verification";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Separator } from "@/components/ui/separator";
import PasswordInput from "@/components/auth/password-input";
import { Label } from "@/components/ui/label";

export const EmailSection: React.FC<FormSectionProps> = ({ loading, control, register, formState, trigger, next }: FormSectionProps) => {
  const email = useWatch({ control, name: "email" });
  const emailError = formState?.errors?.email?.message;

  useEffect(() => {
    if (emailError) toast.error(emailError);
  }, [emailError]);
  
  return (
    <div className="grid gap-2.5">
      <h1 className="font-bold text-lg">Forgot Password?</h1>
      <p className="text-sm text-muted-foreground">
        No worries, just enter an existing email address associated with an account into the text box below.
      </p>
      <Input 
        type="email"
        {...register("email")}
        autoComplete="off"
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
          onClick={() => next(async () => {
            const result = await trigger("email");
            if (!result) return false;

            const promptResponse = await generatePasswordResetPrompt({ email });
            if (!promptResponse.success) {
              toast.error(promptResponse.error);
              return false;
            }
            
            toast.success(promptResponse.message);
            return true;
          })}
          disabled={loading}
          className="w-18 h-full mealicious-button text-sm flex justify-center items-center font-semibold py-2 px-4 rounded-md"
        >
          {loading ? <LoaderCircle size={18} className="animate-spin"/> : "Enter"}
        </button>
      </div>
    </div>
  );
};

export const OTPSection: React.FC<FormSectionProps & { codeLength?: number; }> = ({ loading, control, setValue, next, codeLength = 6 }) => {
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
        pattern={REGEXP_ONLY_DIGITS}
        spellCheck={false}
      >
        <InputOTPGroup className="w-full flex items-center mx-auto">
          {
            Array.from({ length: codeLength }, (_, i) => i).map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="flex-1 font-bold h-[50px]"
              />
            ))
          }
        </InputOTPGroup>
      </InputOTP>
      <div className="h-[30px] text-muted-foreground flex items-center gap-2.5">
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
          disabled={loading}
          className="w-18 h-full mealicious-button text-sm flex justify-center items-center font-semibold py-2 px-4 rounded-md"
        >
          {loading ? <LoaderCircle size={18} className="animate-spin"/> : "Enter"}
        </button>
      </div>
    </div>
  );
};

export const NewPasswordSection: React.FC<FormSectionProps> = ({ register, formState }) => {
  return (
    <div className="grid gap-2.5">
      <h1 className="font-bold text-lg">Create a New Password</h1>
      <p className="text-sm text-muted-foreground">
        Now, enter a brand new password that is different from the previous password.
      </p>
      {
        formState.errors?.email?.message && (
          <div className="flex items-center gap-1.5 text-red-500 text-xs">
            {formState.errors.email.message}
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
            formState.errors?.password?.message && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs">
                {formState.errors.password.message}
              </div>
            )
          }
        </div>
        <PasswordInput
          id="forgot-password-input"
          {...register("password")}
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
            formState.errors?.confirmPassword?.message && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs">
                {formState.errors.confirmPassword.message}
              </div>
            )
          }
        </div>
        <PasswordInput
          id="forgot-password-confirm-input"
          {...register("confirmPassword")}
          placeholder="Confirm Password"
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
          disabled={formState.isSubmitting}
          className="w-18 h-full mealicious-button text-sm flex justify-center items-center font-semibold py-2 px-4 rounded-md"
        >
          {formState.isSubmitting ? <LoaderCircle size={18} className="animate-spin"/> : "Enter"}
        </button>
      </div>
    </div>
  );
}
