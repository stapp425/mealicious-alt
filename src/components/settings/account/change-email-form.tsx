"use client";

import { type ChangeEmailForm, ChangeEmailFormSchema } from "@/lib/zod/settings";
import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { memo, useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, LoaderCircle, SquarePen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { compareValues, generateCode, sendEmail } from "@/lib/functions/verification";
import { useSession } from "next-auth/react";
import { useAction } from "next-safe-action/hooks";
import { updateEmail } from "@/lib/actions/settings";
import { useRouter } from "next/navigation";

type ChangeEmailFormProps = {
  email: string;
  canEdit: boolean;
};

const MAX_CODE_ATTEMPTS = 3;

export default function ChangeEmailForm({ email, canEdit }: ChangeEmailFormProps) {
  const { refresh } = useRouter();
  const { update } = useSession();
  const [editMode, setEditMode] = useState(false);
  const [open, setOpen] = useState(false);
  const {
    control,
    register,
    trigger,
    reset,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
      isValidating
    }
  } = useForm<ChangeEmailForm>({
    resolver: zodResolver(ChangeEmailFormSchema),
    defaultValues: { email }
  });
  const currentEmail = useWatch({ control, name: "email" });
  const areEmailsEqual = currentEmail === email;

  const { executeAsync } = useAction(updateEmail, {
    onSuccess: async ({ data, input }) => {
      if (!data) return;
      setOpen(false)
      reset({ email: input.email });
      toast.success(data.message);
      await update({ email: input.email });
      refresh();
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const onSubmit = handleSubmit(async (data) => {
    await executeAsync(data);
  });

  useEffect(() => {
    if (!open) {
      reset();
      setEditMode(false);
    }
  }, [open]);
  
  return (
    <form id="change-email-form" onSubmit={onSubmit} className="flex flex-col gap-1.5">
      <h1 className="font-bold text-xl">Email</h1>
      <p className="text-muted-foreground mb-1">Change your email address here.</p>
      {
        errors.email?.message && (
          <div className="flex items-center gap-1.5 text-red-500 text-xs">
            {errors.email.message}
          </div>
        )
      }
      <div className="flex items-center gap-3">
        <Input 
          type="email"
          disabled={!editMode || !canEdit}
          placeholder="Email"
          {...register("email")}
          className="flex-1 shadow-none rounded-sm"
        />
        <div className={cn("ml-auto flex items-center gap-3", !canEdit && "hidden")}>
          {
            editMode ? (
              <>
              <Dialog open={open} onOpenChange={setOpen}>
                <button
                  type="button"
                  disabled={areEmailsEqual || isSubmitting || isValidating}
                  onClick={async () => {
                    const validateResult = await trigger("email");
                    if (validateResult) setOpen(true);
                  }}
                  className="mealicious-button flex items-center justify-center font-semibold size-9 rounded-sm"
                >
                  {isSubmitting || isValidating ? <LoaderCircle size={18} className="animate-spin"/> : <Check size={20} strokeWidth={1.25}/>}
                </button>
                <DialogContent
                  onPointerDownOutside={(e) => e.preventDefault()}
                  className="grid gap-6"
                >
                  <VisuallyHidden>
                    <DialogHeader>
                      <DialogTitle>Email Verification</DialogTitle>
                      <DialogDescription>
                        Trying to verify a changed email? This dialog helps in assisting users in changing their emails.
                      </DialogDescription>
                    </DialogHeader>
                  </VisuallyHidden>
                  <EmailVerification
                    open={open}
                    email={currentEmail}
                    loading={isSubmitting || isValidating}
                  />
                </DialogContent>
              </Dialog>
              <button
                type="button"
                disabled={isSubmitting || isValidating}
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
    </form>
  );
}

type EmailVerificationProps = {
  open: boolean;
  loading: boolean;
  email: string;
  codeLength?: number;
};

const EmailVerification = memo(({ open, loading, email, codeLength = 6 }: EmailVerificationProps) => {
  const generatedCode = useRef("");
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_CODE_ATTEMPTS);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [pending, startTransition]= useTransition();

  const generateEmailVerification = (email: string, codeLength: number) => startTransition(async () => {
    setCode("");
    const [code, hashedCode] = await generateCode(codeLength);
    
    generatedCode.current = hashedCode;
    setRemainingAttempts(MAX_CODE_ATTEMPTS);
    await sendEmail({
      from: "Mealicious <no-reply@mealicious.shawntapp.com>",
      to: [email],
      subject: "Email change verification code",
      html: `<p>You recently requested for an email change! Your verification code is <b>${code}</b>.</p>`
    });

    toast.success("Verification code sent!");
  });

  useEffect(() => {
    if (open) generateEmailVerification(email, codeLength);
    else {
      generatedCode.current = "";
      setCode("");
    }
  }, [open, setCode]);

  return (
    <div className="grid gap-2.5">
      <h1 className="font-bold text-xl">Almost There!</h1>
      <p className="text-sm text-muted-foreground">
        Email verification successful! Before changing the email, we need to verify that you have access to it. We sent a verification code to <b className="font-semibold text-accent-foreground">{email}</b>.
      </p>
      <InputOTP
        value={code}
        onChange={(val) => setCode(val)}
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
      <div className="w-fit bg-mealicious-primary text-white font-semibold text-xs mt-1 py-2 px-4 rounded-sm">
        {remainingAttempts}/{MAX_CODE_ATTEMPTS} attempts remaining
      </div>
      <div className="h-[25px] text-muted-foreground flex items-center gap-2.5">
        <span className="font-semibold">Didn&apos;t get a code?</span>
        <Separator orientation="vertical"/>
        <Button
          type="button"
          variant="link"
          disabled={pending || loading || verifying}
          className="cursor-pointer text-mealicious-primary p-0!"
          onClick={() => generateEmailVerification(email, codeLength)}
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
          form="change-email-form"
          onClick={async () => {
            if (remainingAttempts <= 0) toast.info("You do not have any attempts remaining. Try sending another code!");
            setVerifying(true);
            const compareResult = await compareValues(code, generatedCode.current);
            if (!compareResult) {
              setRemainingAttempts((a) => Math.max(0, a - 1));
              setVerifying(false);
              toast.error("Incorrect code. Please try again.");
              return;
            }

            setVerifying(false);
            const form = document.getElementById("change-email-form") as HTMLFormElement | null;
            form?.requestSubmit();
          }}
          disabled={remainingAttempts <= 0 || pending || loading || verifying}
          className="w-18 h-full mealicious-button text-sm flex justify-center items-center font-semibold py-2 px-4 rounded-md"
        >
          {loading || verifying ? <LoaderCircle size={18} className="animate-spin"/> : "Enter"}
        </button>
      </div>
    </div>
  );
});

EmailVerification.displayName = "EmailVerification";
