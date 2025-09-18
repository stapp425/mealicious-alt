
import siteLogo from "@/img/logo/mealicious-logo.svg";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SignInForm from "@/components/auth/sign-in-form";
import ramenBanner from "@/img/banner/ramen-bowl.jpg";
import ProviderButton from "@/components/auth/provider-button";
import { Separator } from "@/components/ui/separator";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ForgotPassword from "@/components/auth/forgot-password";
import { signIn } from "@/auth";
import githubLogo from "@/img/logo/github-logo.svg";
import googleLogo from "@/img/logo/google-logo.svg";

export const metadata: Metadata = {
  title: "Login | Mealicious",
  description: "The login portal for Mealicious."
};

export default function Page() {
  return (
    <div className="size-full 2xl:max-w-312 2xl:max-h-250 grid sm:grid-cols-[1fr_min(32rem,33%)] xl:grid-cols-[1fr_min(46rem,50%)] 2xl:border 2xl:border-border overflow-hidden">
      <div className="flex flex-col gap-4 max-w-125 m-auto p-4 md:p-10">
        <Image
          src={siteLogo}
          alt="Mealicious Logo"
          className="w-[clamp(6rem,50%,12rem)] mx-auto pt-4 pb-4 sm:pb-6 dark:invert"
          priority
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-sm text-muted-foreground font-semibold text-nowrap md:text-wrap">Log in with these providers</h1>
          <Suspense fallback={<AuthButtonsSkeleton />}>
            <div className="flex justify-center items-center gap-3">
              <ProviderButton 
                providerImage={googleLogo}
                providerName="Google"
                signIn={async () => {
                  "use server";
                  await signIn("google");
                }}
              />
              <ProviderButton 
                imageClassName="dark:invert transition-colors"
                providerImage={githubLogo}
                providerName="GitHub"
                signIn={async () => {
                  "use server";
                  await signIn("github");
                }}
              />
            </div>
          </Suspense>
        </div>
        <div className="flex justify-between items-center gap-3">
          <hr className="flex-1"/>
          <h2 className="text-muted-foreground font-semibold text-xs text-nowrap">OR LOG IN WITH YOUR EMAIL</h2>
          <hr className="flex-1"/>
        </div>
        <SignInForm />
        <div className="grid gap-2">
          <div className="h-8 flex justify-center text-muted-foreground items-center gap-3">
            Don&apos;t have an account?
            <Separator orientation="vertical"/>
            <Link href="/register" className="text-mealicious-primary hover:text-mealicious-primary-hover">
              Sign Up
            </Link>
          </div>
          <ForgotPassword />
        </div>
      </div>
      <div className="relative hidden sm:block">
        <Image 
          src={ramenBanner}
          alt="A delicious serving of ramen!"
          fill
          priority
          className="object-cover object-center contrast-80"
        />
        <div className="select-none absolute bottom-4 left-4 w-fit bg-white text-black font-semibold py-2 px-5 text-sm rounded-sm">
          Image by <Link 
            href="https://www.freepik.com/free-photo/high-angle-delicious-ramen-bowl_10223145.htm#fromView=search&page=1&position=11&uuid=677d8979-48db-4a4d-9337-588d14365bdc&query=ramen"
            target="_blank"
            prefetch={false}
            className="underline"
          >
            Freepik
          </Link>
        </div>
      </div>
    </div>
  );
}

function AuthButtonsSkeleton() {
  return (
    <div className="flex justify-center items-center gap-3">
      <Skeleton className="h-12 rounded-md"/>
      <Skeleton className="h-12 rounded-md"/>
    </div>
  );
}
