"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { generateEmailVerification } from "@/lib/functions/verification";
import { toast } from "sonner";
import { verifyEmail } from "@/lib/actions/auth";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";

type VerifyEmailProps = {
  email: string;
  codeLength?: number;
};

export default function VerifyEmailForm({ email, codeLength = 6 }: VerifyEmailProps) {
  const { replace } = useRouter();
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { 
    control,
    setValue,
    handleSubmit
  } = useForm<{ input: string; }>({
    defaultValues: {
      input: ""
    }
  });
  
  const input = useWatch({ control, name: "input" });
  const { executeAsync } = useAction(verifyEmail, {
    onExecute: () => setLoading(true),
    onSuccess: () => {
      replace("/dashboard");
      toast.success("Email successfully verified!");
    },
    onError: () => {
      toast.error("Verification failed. Try entering the code again or resend another code.");
      setLoading(false);
    }
  });

  const onSubmit = handleSubmit(async (data) => {
    await executeAsync({ email, code: data.input });
  });
  
  return (
    <form onSubmit={onSubmit} className="grid gap-3.5">
      <h1 className="font-bold text-2xl">Almost There!</h1>
      <h2 className="font-semibold text-muted-foreground">
        Before signing up, we just need to confirm that this email is real. A verification code is sent to <b className="font-semibold text-accent-foreground">{email}</b>.
      </h2>
      <InputOTP
        value={input}
        onChange={(val) => setValue("input", val)}
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
                className="flex-1 font-bold h-[50px] sm:h-[75px]"
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
          disabled={resendLoading}
          className="cursor-pointer text-mealicious-primary p-0!"
          onClick={async () => {
            setResendLoading(true);
            await generateEmailVerification({ email, codeLength });
            setResendLoading(false);
            toast.success("Verification code sent!");
          }}
        >
          Resend OTP
        </Button>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mealicious-button flex justify-center items-center font-bold p-2 rounded-md"
      >
        {loading ? <LoaderCircle className="animate-spin"/> : "Verify"}
      </button>
      <Link
        href="/login"
        prefetch={false}
        className="font-semibold text-muted-foreground text-sm flex items-center gap-2.5"
      >
        <ArrowLeft className="shrink-0"/>
        Back to Login
      </Link>
    </form>
  );
}
