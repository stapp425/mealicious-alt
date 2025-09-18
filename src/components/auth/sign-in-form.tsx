"use client";

import { type SignInForm, SignInFormSchema } from "@/lib/zod/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import PasswordInput from "@/components/auth/password-input";
import { signInWithCredentials } from "@/lib/actions/auth";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const { replace } = useRouter();
  const [loading, setLoading] = useState(false);
  
  const {
    register, 
    handleSubmit,
    formState: { errors }
  } = useForm({ 
    resolver: zodResolver(SignInFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit"
  });

  const { execute } = useAction(signInWithCredentials, {
    onExecute: () => setLoading(true),
    onSuccess: ({ data }) => replace(data.redirectUrl),
    onError: ({ error: { serverError } }) => {
      toast.error(serverError || "There was an internal error while signing in.");
      setLoading(false);
    }
  });
  
  return (
    <form onSubmit={handleSubmit(execute)} className="grid gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1 lg:flex-row md:justify-between">
          <Label
            htmlFor="email"
            className="text-foreground required-field"
          >
            Email
          </Label>
          {
            errors.email?.message && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs">
                {errors.email.message}
              </div>
            )
          }
        </div>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="Email"
          autoComplete="username"
          className="shadow-none rounded-sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1 lg:flex-row md:justify-between">
          <Label
            htmlFor="password"
            className="text-foreground required-field"
          >
            Password
          </Label>
          { 
            errors?.password?.message && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs">
                {errors.password.message}
              </div>
            )
          }
        </div>
        <PasswordInput
          id="password"
          {...register("password")}
          autoComplete="current-password"
          className="shadow-none rounded-sm"
        />
      </div>
      <div className="flex flex-col justify-center">
        <button
          type="submit"
          disabled={loading}
          className="mealicious-button flex justify-center items-center font-bold mt-2 p-2 rounded-md"
        >
          {loading ? <LoaderCircle className="animate-spin"/> : "Log In"}
        </button>
      </div>
    </form>
  );
}
