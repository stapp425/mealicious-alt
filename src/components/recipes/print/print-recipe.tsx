"use client";

import { Separator } from "@/components/ui/separator";
import { Unit, units } from "@/lib/types";
import { format } from "date-fns";
import { Clock, Printer } from "lucide-react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

type PrintRecipeProps = {
  recipe: {
    title: string;
    description: string | null;
    createdAt: Date;
    servingSizeAmount: number;
    servingSizeUnit: Unit["abbreviation"];
    creator: {
      id: string;
      name: string;
    };
    nutritionalFacts: {
      amount: number;
      unit: string;
      nutrition: {
        id: string;
        name: string;
      };
    }[];
    ingredients: {
      id: string;
      amount: number;
      unit: Unit["abbreviation"];
      name: string;
      note: string | null;
    }[];
    instructions: {
      id: string;
      index: number;
      title: string;
      time: number;
      description: string;
    }[];
  }
};

export default function PrintRecipe({ recipe }: PrintRecipeProps) {
  const printContent = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printContent,
    documentTitle: recipe.title.trim().replaceAll(/\W/g, "-"),
    suppressErrors: true
  });

  const servingSizeUnit = units.find((u) => u.abbreviation === recipe.servingSizeUnit)!;
  
  return (
    <div ref={printContent} className="flex-1 bg-background flex flex-col gap-2 max-w-188 min-h-full mx-auto p-6 print:max-w-none">
      <section className="flex flex-col items-start gap-2">
        <h1 className="font-bold text-4xl hyphens-auto">{recipe.title}</h1>
        <button onClick={() => handlePrint()} className="cursor-pointer font-semibold bg-slate-600 hover:bg-slate-700 text-white text-sm flex items-center gap-2 print:hidden py-2 px-5 rounded-sm transition-colors">
          <Printer size={14}/>
          Print
        </button>
        {
          recipe.description ? (
            <p className="text-muted-foreground text-lg hyphens-auto line-clamp-3">{recipe.description}</p>
          ) : (
            <p className="italic text-muted-foreground">No description is available.</p>
          )
        }
        <h2 className="font-semibold text-sm">
          Created by {recipe.creator.name} | Made on {format(recipe.createdAt, "MMM d, yyyy")}
        </h2>
      </section>
      <section className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl">Nutritional Facts</h1>
        <Separator />
        <h2 className="font-bold text-lg">Serving Size: {recipe.servingSizeAmount} {recipe.servingSizeAmount !== 1 ? servingSizeUnit.pluralName : servingSizeUnit.name} ({recipe.servingSizeUnit})</h2>
        <ul>
          {
            recipe.nutritionalFacts.map((n) => {
              const foundUnit = units.find((u) => u.abbreviation === n.unit)!;

              return (
                <li key={n.nutrition.id} className="list-inside list-disc">
                  <b>{n.nutrition.name}</b>: {n.amount} {n.amount !== 1 ? foundUnit.pluralName : foundUnit.name} ({n.unit})
                </li>
              );
            })
          }
        </ul>
      </section>
      <section className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl">Ingredients</h1>
        <Separator />
        <ul>
          {
            recipe.ingredients.map((i) => (
              <li key={i.id} className="list-inside list-disc">
                {i.amount} {i.unit} {i.name}
                {
                  i.note && (
                    <ul>
                      <li className="indent-8 list-inside text-muted-foreground">- {i.note}</li>
                    </ul>
                  )
                }
              </li>
            ))
          }
        </ul>
      </section>
      <section className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl">Instructions</h1>
        <Separator />
        <ol className="flex flex-col gap-2">
          { 
            recipe.instructions.map((i) => (
              <li
                key={i.id}
                className="flex flex-col items-start gap-1.5 text-left overflow-hidden print:break-inside-avoid"
              >
                <h2 className="font-bold text-lg hyphens-auto line-clamp-2 -mt-1">{i.index}. {i.title}</h2>
                <div className="font-semibold text-sm text-nowrap flex items-center gap-1.5 text-muted-foreground">
                  <Clock size={14}/>
                  {Math.floor(i.time)} mins
                </div>
                <p className="flex-1 text-left hyphens-auto text-secondary-foreground">{i.description}</p>
              </li>
            ))
          }
        </ol>
      </section>
    </div>
  );
}