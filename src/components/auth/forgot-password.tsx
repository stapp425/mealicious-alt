"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { resetPassword } from "@/util/auth"
import { SubmitHandler, useForm } from "react-hook-form"
import AuthInput from "./AuthInput"
import Button from "../theme/Button"
import z from "zod";
import SignInForm from "./sign-in-form";

type EmailInput = { email: string }

export default function ForgotPassword() {  
  const { 
    register,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm<z.infer<typeof SignInForm.>>({ defaultValues: { email: "" } })

  const submitResetPassword: SubmitHandler<EmailInput> = async (data) => {
    try {
      await resetPassword(data.email)
      alert("A prompt has been sent to your email.")
    } catch (err: any) {
      alert("This email does not exist in our system.")
    }
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-center text-orange-500 hover:text-orange-600">
          Forgot your password?
        </button>
      </DialogTrigger>
      <DialogContent className="p-6 w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-bold text-xl">Reset Password</DialogTitle>
          <DialogDescription className="font-semibold">
            Enter an email below to reset its password. Please note that this email must be already in our systems.
          </DialogDescription>
          <form 
            onSubmit={handleSubmit(submitResetPassword)}
            className="pt-2 space-y-4"
          >
            <AuthInput
              id="email"
              label="E-Mail"
              {
                ...register("email", {
                  required: "An email is required",
                  pattern: {
                    value: /(^[^\s@]+@[^\s@]+\.[^\s@]+$)/,
                    message: "Not a valid email format"
                  },
                  maxLength: {
                    value: 20,
                    message: "Cannot exceed 20 characters long"
                  }
                })
              }
              errorMessage={errors.email?.message}
              placeholder="example@domain.com"
            />
            <DialogFooter>
              <Button>Reset Password</Button>
            </DialogFooter>
          </form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}