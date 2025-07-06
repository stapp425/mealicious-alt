"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";

type DescriptionProps = {
  description: string | null;
};

export default function Description({ description }: DescriptionProps) {
  return (
    <section className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-xl">Description</h2>
            <Info size={16} className="cursor-pointer"/>
          </div>
        </PopoverTrigger>
        <PopoverContent className="text-xs font-semibold text-muted-foreground p-3 text-wrap hyphens-auto" align="start">
          A brief yet flavorful text that gives an insight on what the recipe is about.
        </PopoverContent>
      </Popover>
      <Separator />
      {
        description ? (
          <p className="text-muted-foreground text-sm text-wrap truncate hyphens-auto">{description}</p>
        ) : (
          <p className="italic text-muted-foreground">No description is available.</p>
        )
      }
    </section>
  );
}
