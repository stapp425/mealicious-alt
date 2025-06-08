"use client";

import { SignInFormSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import PasswordInput from "./password-input";
import z from "zod";
import { signInWithCredentials } from "@/lib/actions/auth";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

export default function SignInForm() {
  const {
    register, 
    handleSubmit,
    watch,
    formState: { 
      errors,
      isSubmitting
    }
  } = useForm<z.infer<typeof SignInFormSchema>>({ 
    resolver: zodResolver(SignInFormSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    const signInResult = await signInWithCredentials({ email, password });

    if (signInResult.success) {
      toast.success(signInResult.message);
    } else {
      toast.error(signInResult.error);
    }
  });
  
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1 lg:flex-row md:justify-between">
          <Label
            htmlFor="name"
            className="text-foreground after:content-['_*'] after:font-bold after:text-red-600"
          >
            E-Mail
          </Label>
          {
            errors.email?.message && (
              <div className="flex items-center gap-1.5 font-bold text-red-500 text-xs">
                {errors.email.message}
              </div>
            )
          }
        </div>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="E-Mail"
          className="mt-2"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1 lg:flex-row md:justify-between">
          <Label
            htmlFor="password"
            className="text-foreground after:content-['_*'] after:font-bold after:text-red-600"
          >
            Password
          </Label>
          { 
            errors?.password?.message && (
              <div className="flex items-center gap-1.5 font-bold text-red-500 text-xs">
                <i className="fa-solid fa-circle-exclamation"/>
                {errors.password.message}
              </div>
            )
          }
        </div>
        <PasswordInput
          id="password"
          isInputEmpty={!watch("password")}
          {...register("password")}
        />
      </div>
      <div className="flex flex-col justify-center mt-4">
        {/* <ForgotPassword/> */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mealicious-button flex justify-center items-center font-bold mt-auto px-6 py-3 rounded-md"
        >
          {isSubmitting ? <LoaderCircle className="animate-spin"/> : "Log In"}
        </button>
      </div>
    </form>
  );
}
