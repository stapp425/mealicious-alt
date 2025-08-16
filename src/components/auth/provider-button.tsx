"use client";

import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { StaticImport } from "next/dist/shared/lib/get-img-props";

type ProviderButtonProps = {
  imageClassName?: string;
  providerName: string;
  providerImage: string | StaticImport;
  signIn: () => Promise<void>;
};

export default function ProviderButton({
  imageClassName,
  providerName,
  providerImage,
  className,
  signIn,
  ...props
}: ProviderButtonProps & Omit<React.ComponentProps<"button">, "onClick" | "children">) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (!error) return;
    let errorMessage: string;
    
    switch (error) {
      case "OAuthAccountNotLinked":
        errorMessage = "There already exists an account with that email.";
        break;
      case "AccessDenied":
        errorMessage = "You were denied permission to sign in.";
        break;
      case "AccountNotLinked":
        errorMessage = "The email address is already linked to another account, please use a different email."
        break;
      case "InvalidCallbackUrl":
        errorMessage = "Failed to verify the callback URL.";
        break;
      case "JWTSessionError":
        errorMessage = "Failed to create a session.";
        break;
      case "OAuthCallbackError":
        errorMessage = "There was an error during the sign in process.";
        break;
      default:
        errorMessage = "There was an unknown error while trying to sign in.";
    }
    
    toast.error(errorMessage);
  }, [error]);

  return (
    <button
      type="button"
      onClick={signIn}
      className={cn(
        "w-full flex-1 border cursor-pointer flex justify-center items-center gap-3 py-2.5 px-5 rounded-sm hover:bg-muted transition-colors",
        className
      )}
      {...props}
    >
      <Image
        src={providerImage}
        alt={`${providerName} Icon`}
        width={20}
        height={20}
        className={imageClassName}
      />
      <span className="font-semibold text-secondary-foreground transition-colors">
        {providerName}
      </span>
    </button>
  );
}
