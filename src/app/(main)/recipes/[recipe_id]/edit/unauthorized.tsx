"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Unauthorized() {
  const { back, push } = useRouter();
  
  return (
    <div className="h-full flex flex-col justify-center items-center p-4">
      <div className="bg-sidebar border border-border w-full max-w-125 flex flex-col justify-center items-center gap-6 mx-auto py-10 px-8 rounded-md">
        <Lock size={96} className="stroke-muted-foreground"/>
        <h1 className="text-xl text-center font-bold">
          You do not have permission to edit this recipe.
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
      <title>(401) Recipe Not Authorized | Mealicious</title>
    </div>
  );
}
