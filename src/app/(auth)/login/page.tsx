
import siteLogo from "@/img/logo/mealicious-logo.svg";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SignInForm from "@/components/auth/sign-in-form";
import ramenBanner from "@/img/banner/ramen-bowl.jpg";
import { GitHubButton, GoogleButton } from "@/components/auth/provider-buttons";
import { Separator } from "@/components/ui/separator";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Login | Mealicious",
  description: "The login portal for Mealicious."
};

export default function Page() {
  return (
    <div className="size-full 2xl:max-w-[1250px] 2xl:max-h-[1000px] grid sm:grid-cols-[1fr_min(500px,33%)] xl:grid-cols-[1fr_min(750px,50%)] 2xl:border 2xl:border-border overflow-hidden">
      <div className="flex flex-col gap-4 max-w-[500px] m-auto p-4 md:p-10">
        <Image
          src={siteLogo}
          alt="Mealicious Logo"
          className="w-[clamp(100px,50%,200px)] mx-auto pt-4 pb-4 sm:pb-6 dark:invert"
          priority
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-sm text-muted-foreground font-semibold text-nowrap md:text-wrap">Log in with these providers</h1>
          <Suspense fallback={<AuthButtonsSkeleton />}>
            <div className="flex justify-center items-center gap-3">
              <GoogleButton />
              <GitHubButton />
            </div>
          </Suspense>
        </div>
        <div className="flex justify-between items-center gap-3">
          <hr className="flex-1"/>
          <h2 className="text-muted-foreground font-semibold text-xs text-nowrap">OR LOG IN WITH YOUR E-MAIL</h2>
          <hr className="flex-1"/>
        </div>
        <SignInForm />
        <div className="h-8 flex justify-center text-muted-foreground items-center gap-3">
          Don&apos;t have an account?
          <Separator orientation="vertical"/>
          <Link href="/register" className="text-mealicious-primary hover:text-orange-700">
            Sign Up
          </Link>
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
        <div className="select-none absolute bottom-4 right-4 w-fit bg-white text-black font-semibold py-2 px-5 text-sm rounded-sm">
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
