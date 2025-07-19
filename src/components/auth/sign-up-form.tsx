"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type SignUpForm, SignUpFormSchema } from "@/lib/zod/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp } from "@/lib/actions/auth";
import PasswordInput from "@/components/auth/password-input";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";

type SignUpField = {
  id: keyof SignUpForm,
  label: string,
  placeholder: string,
  type: "text" | "email" | "password"
};

const signUpFieldValues: SignUpField[] = [
  {
    id: "name",
    label: "Username",
    placeholder: "Username",
    type: "text"
  },
  {
    id: "email",
    label: "E-Mail",
    placeholder: "E-Mail",
    type: "email"
  },
  {
    id: "password",
    label: "Password",
    placeholder: "Password",
    type: "password"
  },
  {
    id: "confirmPassword",
    label: "Confirm Password",
    placeholder: "Confirm Password",
    type: "password"
  }
];

export default function SignUpForm() {
  const { replace } = useRouter();
  const [loading, setLoading] = useState(false);
  const { 
    register, 
    handleSubmit,
    formState: { 
      isValidating,
      errors
    }
  } = useForm<SignUpForm>({
    resolver: zodResolver(SignUpFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    delayError: 150,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });
  const { executeAsync } = useAction(signUp, {
    onExecute: () => setLoading(true),
    onSuccess: ({ data }) => {
      if (!data) return;
      replace(`/verify?id=${data.verifyId}`);
    },
    onError: ({ error: { serverError } }) => {
      setLoading(false);
      toast.error(serverError)
    }
  });

  const onSubmit = handleSubmit(async (data) => {
    await executeAsync({ registerData: data });
  });

  return (
    <form onSubmit={onSubmit} className="size-full flex flex-col gap-4">
      {
        signUpFieldValues.map((field) => (
          <div 
            key={field.id}
            className="flex flex-col gap-2"
          >
            <div className="flex flex-col sm:flex-row gap-0.5 justify-between">
              <Label
                htmlFor={field.id}
                className="text-foreground required-field"
              >
                {field.label}
              </Label>
              { 
                errors[field.id]?.message && (
                  <div className="flex items-center gap-1.5 text-red-500 text-xs">
                    {errors[field.id]?.message}
                  </div>
                )
              }
            </div>
            {
              field.type === "password" ? (
                <PasswordInput
                  id={field.id}
                  {...register(field.id)}
                  className="shadow-none rounded-sm"
                />
              ) : (
                <Input
                  id={field.id}
                  type={field.type}
                  autoComplete="off"
                  {...register(field.id)}
                  placeholder={field.placeholder}
                  className="shadow-none rounded-sm"
                />
              )
            }
          </div>
        ))
      }
      <button
        type="submit"
        disabled={loading || isValidating}
        className="mealicious-button flex justify-center items-center font-bold mt-2.5 p-2 rounded-md"
      >
        {loading || isValidating ? <LoaderCircle className="animate-spin"/> : "Sign Up"}
      </button>
    </form>
  );
}
