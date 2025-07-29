import { db } from "@/db";
import { emailVerification } from "@/db/schema";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createLoader, parseAsString, SearchParams } from "nuqs/server";
import Image from "next/image";
import siteLogo from "@/img/logo/mealicious-logo.svg";
import spaghettiBanner from "@/img/banner/spaghetti.jpg";
import Link from "next/link";
import VerifyEmailForm from "@/components/auth/verify-email-form";
import { generateEmailVerification } from "@/lib/functions/verification";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export const metadata: Metadata = {
  title: "Verify Email | Mealicious",
  description: "Verify your email address here."
};

const loadSearchParams = createLoader({
  id: parseAsString
});

export default async function Page({ searchParams }: PageProps) {
  const { id } = await loadSearchParams(searchParams);
  if (!id) redirect("/login");
  
  const foundUser = await db.query.user.findFirst({
    where: (user, { and, eq, exists, sql }) => and(
      eq(user.id, id),
      exists(
        db.select()
          .from(emailVerification)
          .where(eq(emailVerification.email, sql`lower(${user.email})`))
      )
    ),
    columns: {
      id: true,
      email: true,
      emailVerified: true
    }
  });

  if (!foundUser || foundUser.emailVerified) redirect("/login");
  // always generate a new code upon entering page
  await generateEmailVerification({ email: foundUser.email });
  
  return (
    <div className="size-full 2xl:max-w-[1250px] 2xl:max-h-[1000px] grid sm:grid-cols-[min(500px,33%)_1fr] xl:grid-cols-[min(750px,50%)_1fr] 2xl:border 2xl:border-border overflow-hidden">
      <div className="relative hidden sm:block">
        <Image 
          src={spaghettiBanner}
          alt="A delicious side of spaghetti!"
          fill
          priority
          className="object-cover object-center contrast-67"
        />
        <div className="select-none absolute bottom-4 left-4 w-fit bg-white text-black font-semibold py-2 px-5 text-sm rounded-sm">
          Image by <Link 
            href="https://www.freepik.com/author/jcomp"
            target="_blank"
            prefetch={false}
            className="underline"
          >
            jcomp
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-4 max-w-[500px] m-auto p-4 md:p-10">
        <Image
          src={siteLogo}
          alt="Mealicious Logo"
          className="w-[clamp(100px,50%,200px)] mx-auto pt-4 pb-4 sm:pb-6 dark:invert"
        />
        <VerifyEmailForm email={foundUser.email}/>
      </div>
    </div>
  );
}
