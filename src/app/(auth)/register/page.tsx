import SignUpForm from "@/components/auth/sign-up-form";
import siteLogo from "@/img/logo/mealicious-logo.svg";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import pizzaBanner from "@/img/banner/pizza.jpg";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Register | Mealicious",
  description: "The register portal for Mealicious."
};

export default async function Page() {
  return (
    <div className="size-full 2xl:max-w-312 2xl:max-h-250 grid sm:grid-cols-[min(32rem,33%)_1fr] xl:grid-cols-[min(46rem,50%)_1fr] 2xl:border 2xl:border-border overflow-hidden">
      <div className="relative hidden sm:block">
        <Image 
          src={pizzaBanner}
          alt="A delicious slice of pizza!"
          fill
          priority
          className="object-cover object-center contrast-67"
        />
        <div className="select-none absolute bottom-4 left-4 w-fit bg-white text-black font-semibold py-2 px-5 text-sm rounded-sm">
          Image by <Link 
            href="https://www.freepik.com/author/kamranaydinov"
            target="_blank"
            prefetch={false}
            className="underline"
          >
            KamranAydinov
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-4 max-w-125 m-auto p-4 md:p-10">
        <Image
          src={siteLogo}
          alt="Mealicious Logo"
          className="w-[clamp(6rem,50%,12rem)] mx-auto pt-4 pb-4 sm:pb-6 dark:invert"
        />
        <SignUpForm />
        <div className="h-8 flex justify-center text-muted-foreground items-center gap-3">
          Already have an account?
          <Separator orientation="vertical"/>
          <Link href="/login" className="text-mealicious-primary hover:text-mealicious-primary-hover">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
