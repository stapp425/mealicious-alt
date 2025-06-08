import SignUpForm from "@/components/auth/sign-up-form";
import siteLogo from "@/img/logo/mealicious-logo.svg";
import registerImage from "@/img/register-page.jpg";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Register | Mealicious",
  description: "The register portal for Mealicious."
};

export default async function Page() {
  return (
    <div className="flex flex-col justify-bewteen gap-4 w-[clamp(300px,85vw,450px)] p-4">
      <Image
        src={siteLogo}
        alt="Mealicious Logo"
        className="mx-auto w-[clamp(100px,50%,200px)] pt-4 dark:invert"
      />
      <SignUpForm />
      <div className="text-center text-primary">
        Already have an account? | <Link href="/login" className="text-mealicious-primary hover:text-mealicious-primary-hover">Log In</Link>
      </div>
    </div>
  );
}
