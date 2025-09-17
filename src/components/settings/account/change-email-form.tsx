"use client";

import { ChangeEmailFormSchema, type ChangeEmailForm } from "@/lib/zod/settings";
import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, Info, LoaderCircle, SquarePen, X } from "lucide-react";
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
import { EmailSchema } from "@/lib/zod/auth";

type ChangeEmailFormProps = {
  email: string;
  canEdit: boolean;
};

const CODE_LENGTH = 6;
const MAX_CODE_ATTEMPTS = 3;

type UseEmailVerificationProps = {
  codeLength: number;
  maxCodeAttempts: number;
  onEmailGeneration?: (email: string) => void;
  onVerificationSuccess?: (code: string) => void;
  onVerificationFailure?: (code: string) => void;
};

export default function ChangeEmailForm({
  email,
  canEdit
}: ChangeEmailFormProps) {
  const { update } = useSession();
  const verifyEmailButton = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const {
    control,
    register,
    reset,
    handleSubmit,
    watch,
    formState: {
      errors,
      isValidating,
      isSubmitting,
      defaultValues
    }
  } = useForm({
    resolver: zodResolver(ChangeEmailFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { email }
  });

  const currentEmail = useWatch({ control, name: "email" });

  const { execute, isExecuting } = useAction(updateEmail, {
    onSuccess: async ({ data, input }) => {
      toast.success(data.message);
      setOpen(false);
      reset({ email: input });
      await update({ email: input });
      setEditMode(false);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const {
    codeInput,
    setCodeInput,
    remainingAttempts,
    generateEmailVerification,
    verifyCode,
    isGenerating,
    isVerifying
  } = useEmailVerification({
    codeLength: CODE_LENGTH,
    maxCodeAttempts: MAX_CODE_ATTEMPTS,
    onEmailGeneration: (email) => toast.success(`Email successfully sent to ${email}!`),
    onVerificationFailure: () => toast.error("Verification failed. Either input or send another code!"),
    onVerificationSuccess: () => execute(watch("email"))
  });
  
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <form
        onSubmit={handleSubmit((data) => {
          if (!canEdit) return;

          setOpen(true);
          generateEmailVerification(data.email);
        })}
        className="grid gap-1.5"
      >
        <DialogTrigger
          ref={verifyEmailButton}
          type="button"
          tabIndex={-1}
          className="hidden"
          aria-hidden
        />
        <h1 className="font-bold text-xl">Email</h1>
        <p className="text-muted-foreground mb-1">Change your email address here.</p>
        <div className="flex items-center gap-3">
          <Input 
            type="email"
            {...register("email")}
            disabled={!editMode || !canEdit}
            placeholder="Email"
            className="flex-1 shadow-none rounded-sm"
          />
          <div className={cn("ml-auto flex items-center gap-3", !canEdit && "hidden")}>
            {
              editMode ? (
                <>
                <button
                  type="submit"
                  disabled={currentEmail === defaultValues?.email || isValidating || isSubmitting}
                  className="mealicious-button flex items-center justify-center font-semibold size-9 rounded-sm"
                >
                  {isValidating || isSubmitting ? <LoaderCircle size={18} className="animate-spin"/> : <Check size={20} strokeWidth={1.25}/>}
                </button>
                {
                  canEdit && (
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
                      <div className="grid gap-2.5">
                        <h1 className="font-bold text-xl">Almost There!</h1>
                        <p className="text-sm text-muted-foreground">
                          Email verification successful! Before changing the email, we need to verify that you have access to it. We sent a verification code to <b className="font-semibold text-accent-foreground">{currentEmail}</b>.
                        </p>
                        <InputOTP
                          value={codeInput}
                          onChange={(val) => setCodeInput(val)}
                          maxLength={CODE_LENGTH}
                          pattern={REGEXP_ONLY_DIGITS}
                          spellCheck={false}
                        >
                          <InputOTPGroup className="w-full flex items-center mx-auto">
                            {
                              Array.from({ length: CODE_LENGTH }, (_, i) => i).map((i) => (
                                <InputOTPSlot
                                  key={i}
                                  index={i}
                                  className="flex-1 font-bold h-12"
                                />
                              ))
                            }
                          </InputOTPGroup>
                        </InputOTP>
                        <div className="w-fit bg-mealicious-primary text-white font-semibold text-xs mt-1 py-2 px-4 rounded-sm">
                          {remainingAttempts}/{MAX_CODE_ATTEMPTS} attempts remaining
                        </div>
                        <div className="h-6 text-muted-foreground flex items-center gap-2.5">
                          <span className="font-semibold text-sm">Didn&apos;t get a code?</span>
                          <Separator orientation="vertical"/>
                          <Button
                            type="button"
                            variant="link"
                            disabled={isGenerating || isExecuting}
                            className="cursor-pointer text-mealicious-primary p-0!"
                            onClick={() => generateEmailVerification(watch("email"))}
                          >
                            Resend OTP
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => verifyCode(codeInput)}
                            disabled={remainingAttempts <= 0 || isVerifying || isGenerating || isExecuting}
                            className="w-18 h-full mealicious-button text-sm flex justify-center items-center font-semibold py-2 px-4 rounded-md"
                          >
                            {isVerifying || isExecuting ? <LoaderCircle size={18} className="animate-spin"/> : "Enter"}
                          </button>
                          <DialogClose asChild>
                            <Button 
                              type="button"
                              variant="secondary"
                              className="cursor-pointer"
                            >
                              Cancel
                            </Button>
                          </DialogClose>
                        </div>
                      </div>    
                    </DialogContent>
                  )
                }
                <button
                  type="button"
                  disabled={isValidating || isSubmitting}
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
          <span>{errors.email?.message}</span>
        </div>
      </form>
    </Dialog>
  );
}

function useEmailVerification({
  codeLength,
  maxCodeAttempts,
  onEmailGeneration,
  onVerificationSuccess,
  onVerificationFailure
}: UseEmailVerificationProps) {
  const generatedCode = useRef("");
  const [codeInput, setCodeInput] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState(maxCodeAttempts);
  const [isGenerating, startGenerating] = useTransition();
  const [isVerifying, startVerifying] = useTransition();
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "failure" | "success">("idle");

  const generateEmailVerification = useCallback(
    (email: string) => startGenerating(async () => {
      setVerificationStatus("idle");
      const emailError = EmailSchema.safeParse(email).error;
      if (emailError) {
        toast.error(emailError.issues[0].message)
        return;
      }
      
      const [code, hashedCode] = await generateCode(codeLength);
      
      generatedCode.current = hashedCode;
      setCodeInput("");
      setRemainingAttempts(maxCodeAttempts);
      await sendEmail({
        from: "Mealicious <no-reply@mealicious.shawntapp.com>",
        to: [email],
        subject: "Email change verification code",
        html: `<p>You recently requested for an email change! Your verification code is <b>${code}</b>.</p>`
      });
      onEmailGeneration?.(email);
    }),
    [
      startGenerating,
      setVerificationStatus,
      codeLength,
      setCodeInput,
      setRemainingAttempts,
      maxCodeAttempts,
      onEmailGeneration
    ]
  );

  const verifyCode = useCallback(
    (code: string) => startVerifying(async () => {
      if (remainingAttempts <= 0) {
        setVerificationStatus("failure");
        onVerificationFailure?.(code);
        return;
      }

      const compareResult = await compareValues(code, generatedCode.current);
      if (!compareResult) {
        setVerificationStatus("failure");
        onVerificationFailure?.(code);
        setRemainingAttempts((a) => Math.max(0, a - 1));
        return;
      };

      setVerificationStatus("success");
      onVerificationSuccess?.(code);
    }),
    [
      startVerifying,
      remainingAttempts,
      setVerificationStatus,
      onVerificationFailure,
      setRemainingAttempts,
      onVerificationSuccess
    ]
  );

  return {
    codeInput,
    setCodeInput,
    remainingAttempts,
    isGenerating,
    isVerifying,
    verificationStatus,
    generateEmailVerification,
    verifyCode,
  };
}
