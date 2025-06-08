"use client";

import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { SignUpFormSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithCredentials, signUp } from "@/lib/actions/auth";
import z from "zod";
import PasswordInput from "./password-input";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

type SignUpForm = z.infer<typeof SignUpFormSchema>;

type SignUpField = {
  id: keyof SignUpForm,
  label: string,
  placeholder: string,
  isPassword?: boolean
};

const signUpFieldValues: SignUpField[] = [
  {
    id: "name",
    label: "Username",
    placeholder: "Username"
  },
  {
    id: "email",
    label: "E-Mail",
    placeholder: "E-Mail"
  },
  {
    id: "password",
    label: "Password",
    placeholder: "Password",
    isPassword: true
  },
  {
    id: "confirmPassword",
    label: "Confirm Password",
    placeholder: "Confirm Password",
    isPassword: true
  }
];

export default function SignUpForm() {
  const { 
    register, 
    handleSubmit,
    watch,
    formState: { 
      errors,
      isSubmitting
    }
  } = useForm<SignUpForm>({
    resolver: zodResolver(SignUpFormSchema),
    mode: "onChange",
    delayError: 150,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = handleSubmit(async (data) => {
    const signUpResult = await signUp(data);

    if (!signUpResult.success) {
      return toast.error("Failed to Register", {
        description: signUpResult.error
      });
    }

    const signInResult = await signInWithCredentials({ 
      email: data.email,
      password: data.password
    });
    
    if (signInResult.success) {
      toast.success(signInResult.message);
    } else {
      toast.error(signInResult.error);
    }
  });

  return (
    <form onSubmit={onSubmit} className="size-full flex flex-col gap-4">
      {
        signUpFieldValues.map((field) => (
          <div 
            key={field.id}
            className="flex flex-col gap-2"
          >
            <div className="flex flex-col sm:flex-row gap-1 justify-between">
              <Label
                htmlFor={field.id}
                className="text-foreground after:content-['_*'] after:font-bold after:text-red-600"
              >
                {field.label}
              </Label>
              { 
                errors[field.id]?.message && (
                  <div className="flex items-center gap-1.5 font-bold text-red-500 text-xs">
                    {errors[field.id]?.message}
                  </div>
                )
              }
            </div>
            {
              field.isPassword ? (
                <PasswordInput
                  id={field.id}
                  isInputEmpty={!watch(field.id)}
                  {...register(field.id)}
                />
              ) : (
                <Input
                  id={field.id}
                  type="text"
                  {...register(field.id)}
                  placeholder={field.placeholder}
                />
              )
            }
          </div>
        ))
      }
      <button
        type="submit"
        disabled={isSubmitting}
        className="mealicious-button flex justify-center items-center font-bold px-6 py-3 rounded-md"
      >
        {isSubmitting ? <LoaderCircle className="animate-spin"/> : "Sign Up"}
      </button>
    </form>
  );
}

