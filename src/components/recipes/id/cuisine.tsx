"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import Image from "next/image";
import { parseAsBoolean, useQueryState } from "nuqs";

type CuisineProps = {
  cuisine: {
    id: string;
    description: string;
    adjective: string;
    countryOrigins: {
      country: {
        id: string;
        icon: string;
      };
    }[];
  }; 
};

export default function Cuisine({ cuisine }: CuisineProps) {
  const [showDescription, setShowDescription] = useQueryState(
    "showCuisineDescription",
    parseAsBoolean.withDefault(false)
  );
  
  return (
    <Collapsible open={showDescription} onOpenChange={setShowDescription}>
      <section className="bg-sidebar border border-border flex flex-col gap-3 rounded-md p-3">
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg">Cuisine</h2>
              <Info size={16} className="cursor-pointer"/>
            </div>
          </PopoverTrigger>
          <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
            A cultural style of cooking practices with distinctive ingredients, cooking methods, and presentation of food.
          </PopoverContent>
        </Popover>
        <Separator />
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <Image 
              src={cuisine.countryOrigins[0].country.icon}
              alt={`Flag of ${cuisine.adjective} cuisine`}
              width={35}
              height={35}
              className="object-cover rounded-full"
            />
            <h2 className="font-bold text-lg truncate">{cuisine.adjective}</h2>
          </div>
          <CollapsibleTrigger asChild>
            <Button className="cursor-pointer flex gap-2 items-center" variant="secondary">
              <span className="hidden md:block">{showDescription ? "Hide Description" : "Show Description"}</span>
              {showDescription ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent asChild>
          <p className="text-sm text-muted-foreground">{cuisine.description}</p>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}