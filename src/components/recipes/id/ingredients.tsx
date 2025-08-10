"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Unit, units } from "@/lib/types";
import { Info } from "lucide-react";

type IngredientsProps = {
  ingredients: {
    id: string;
    name: string;
    amount: number;
    unit: Unit["abbreviation"];
    note: string | null;
    isAllergen: boolean;
  }[];
};

export default function Ingredients({ ingredients }: IngredientsProps) {
  return (
    <section className="flex flex-col gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-xl">Ingredients</h2>
            <Info size={16} className="cursor-pointer"/>
          </div>
        </PopoverTrigger>
        <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
          Raw materials that are necessary in making this recipe.
        </PopoverContent>
      </Popover>
      <Separator />
      {
        ingredients.map((i) => {
          const foundUnit = units.find((u) => u.abbreviation === i.unit)!;
          
          return (
            <div key={i.id} className="flex items-center gap-3">
              <Checkbox id={i.name}/>
              <div className="flex flex-col items-start">
                <Label htmlFor={i.name} className="text-base">
                  {i.amount} {i.amount !== 1 ? foundUnit.pluralName : foundUnit.name} ({i.unit}) {i.name}
                </Label>
                {i.note && <p className="text-muted-foreground text-sm">{i.note}</p>}
              </div>
            </div>
          );
        })
      }
    </section>
  );
}