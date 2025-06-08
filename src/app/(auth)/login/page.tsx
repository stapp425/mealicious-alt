
import siteLogo from "@/img/logo/mealicious-logo.svg";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SignInForm from "@/components/auth/sign-in-form";
import googleLogo from "@/img/logo/google-logo.svg";
import githubLogo from "@/img/logo/github-logo.svg";
import { signIn } from "@/auth";

export const metadata: Metadata = {
  title: "Login | Mealicious",
  description: "The login portal for Mealicious."
};

export default function Page() {
  return (
    <div className="flex flex-col justify-between gap-4 w-[clamp(300px,85vw,450px)] p-4">
      <Image
        src={siteLogo}
        alt="Mealicious Logo"
        className="mx-auto w-[clamp(100px,50%,200px)] pt-4 dark:invert"
        priority
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-sm md:text-base font-semibold text-nowrap md:text-wrap">Log in with these providers:</h1>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              "use server";
              await signIn("google");
            }}
            className="group w-full flex-1 border cursor-pointer flex justify-center items-center gap-5 py-3 px-5 rounded-md hover:bg-muted-foreground transition-colors"
          >
            <Image
              src={googleLogo}
              alt="Google Icon"
              width={25}
              height={25}
            />
            <span className="font-semibold text-foreground group-hover:text-background transition-colors">
              Google
            </span>
          </button>
          <button
            type="button"
            onClick={async () => {
              "use server";
              await signIn("github");
            }}
            className="group w-full flex-1 border cursor-pointer flex justify-center items-center gap-5 py-3 px-5 rounded-md hover:bg-muted-foreground transition-colors"
          >
            <Image
              src={githubLogo}
              alt="GitHub Icon"
              width={25}
              height={25}
              className="dark:invert transition-colors"
            />
            <span className="font-semibold text-foreground group-hover:text-background transition-colors">
              GitHub
            </span>
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center gap-5">
        <hr className="flex-1"/>
        <h2 className="font-bold text-xs text-nowrap">OR LOG IN WITH YOUR E-MAIL</h2>
        <hr className="flex-1"/>
      </div>
      <SignInForm />
      <div className="text-center">
        Don't have an account? | <Link href="/register" className="text-orange-500 hover:text-orange-700">Sign Up</Link>
      </div>
    </div>
  );
}