"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import githubLogo from "@/img/logo/github-logo.svg";
import googleLogo from "@/img/logo/google-logo.svg";

export function GitHubButton() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (!error) return;
    if (error === "OAuthAccountNotLinked") {
      toast.error("There already exists an account with that e-mail.");
      return;
    }
    
    toast.error("There was an error while trying to sign in.");
  }, [error]);

  return (
    <button
      type="button"
      onClick={async () => await signIn("github")}
      className="w-full flex-1 border cursor-pointer flex justify-center items-center gap-3 py-2.5 px-5 rounded-sm hover:bg-muted transition-colors"
    >
      <Image
        src={githubLogo}
        alt="GitHub Icon"
        width={20}
        height={20}
        className="dark:invert transition-colors"
      />
      <span className="font-semibold text-secondary-foreground transition-colors">
        GitHub
      </span>
    </button>
  );
}

export function GoogleButton() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (!error) return;
    if (error === "OAuthAccountNotLinked") {
      toast.error("There already exists an account with that e-mail.");
      return;
    }
    
    toast.error("There was an error while trying to sign in.");
  }, [error]);
  
  return (
    <button
      type="button"
      onClick={async () => await signIn("google")}
      className="w-full flex-1 border cursor-pointer flex justify-center items-center gap-3 py-2.5 px-5 rounded-sm hover:bg-muted transition-colors"
    >
      <Image
        src={googleLogo}
        alt="Google Icon"
        width={20}
        height={20}
      />
      <span className="font-semibold text-secondary-foreground transition-colors">
        Google
      </span>
    </button>
  );
}
