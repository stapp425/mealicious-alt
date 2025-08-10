"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Unit } from "@/lib/types";
import { Slot } from "@radix-ui/react-slot";
import { Info, Minus, Plus } from "lucide-react";
import { parseAsInteger, useQueryState } from "nuqs";

type NutritionProps = {
  servingSizeAmount: number;
  servingSizeUnit: Unit["abbreviation"];
  nutritions: {
    amount: number;
    unit: Unit["abbreviation"];
    nutrition: {
      name: string;
      id: string;
      description: string;
    } | null;
  }[];
};

export default function Nutrition({ servingSizeAmount, servingSizeUnit, nutritions }: NutritionProps) {
  const [count, setCount] = useQueryState(
    "servingSizeCount",
    parseAsInteger.withDefault(1)
  );
  
  return (
    <section className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-xl">Nutrition</h2>
            <Info size={16} className="cursor-pointer"/>
          </div>
        </PopoverTrigger>
        <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
          Substances found in food that provide supplementary energy.
        </PopoverContent>
      </Popover>
      <Separator />
      <div className="flex justify-between items-center gap-2">
        <h2 className="border border-border font-semibold py-2 px-4 rounded-sm">Serving Size: {Math.round(servingSizeAmount)} {servingSizeUnit}</h2>
        <div className="flex items-stretch gap-2">
          <button 
            disabled={count <= 1}
            onClick={() => setCount((s) => s - 1)}
            className="size-8 mealicious-button flex justify-center items-center font-semibold p-2 rounded-md"
          >
            <Minus size={14}/>
          </button>
          <span className="size-8 border border-border flex justify-center items-center rounded-sm">{count}</span>
          <button 
            onClick={() => setCount((s) => s + 1)}
            className="size-8 mealicious-button flex justify-center items-center font-semibold p-2 rounded-md"
          >
            <Plus size={14}/>
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center gap-2">
        <h2 className="font-bold">Nutrient</h2>
        <h2 className="font-bold w-[85px]">Amount</h2>
      </div>
      {
        nutritions.map((n, i) => (
          <Slot key={n.nutrition?.id}>
            <>
            <div key={n.nutrition?.id} className="flex justify-between items-center gap-2">
              <h3 className="font-semibold">{n.nutrition?.name}</h3>
              <p className="w-[85px]">{Math.round(n.amount) * count} {n.unit}</p>
            </div>
            {i < nutritions.length - 1 && <Separator />}
            </>
          </Slot>
        ))
      }
    </section>
  );
}
