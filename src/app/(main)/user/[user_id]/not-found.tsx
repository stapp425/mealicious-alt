"use client";

import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ExternalLink, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const { back, push } = useRouter();
  
  return (
    <div className="h-full flex flex-col justify-center items-center p-4">
      <div className="bg-sidebar border border-border w-full max-w-125 flex flex-col justify-center items-center gap-6 mx-auto py-10 px-8 rounded-md">
        <SearchX size={96} className="stroke-muted-foreground"/>
        <h1 className="text-xl text-center font-bold">
          The requested user was not found!
        </h1>
        <Separator />
        <button onClick={() => back()} className="mealicious-button flex items-center gap-2 font-semibold text-white py-2 px-4 rounded-md">
          <ArrowLeft size={16}/>
          Go Back
        </button>
        <button onClick={() => push("/dashboard")} className="mealicious-button flex items-center gap-2 font-semibold text-white py-2 px-4 rounded-md">
          <ExternalLink size={16}/>
          Go to Dashboard
        </button>
      </div>
      <title>(404) User Not Found | Mealicious</title>
    </div>
  );
}
