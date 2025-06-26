"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MealType, mealTypes } from "@/lib/types";
import { X } from "lucide-react";
import { parseAsIndex, parseAsInteger, parseAsStringLiteral, useQueryStates } from "nuqs";

export default function ResultOptions() {
  const [resultOptions, setResultOptions] = useQueryStates({
    page: parseAsIndex.withDefault(0),
    mealType: parseAsStringLiteral(mealTypes),
    maxCalories: parseAsInteger.withDefault(0)
  }, {
    shallow: false
  });
  
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold">Search Options</h2>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Select value={resultOptions.mealType || ""} onValueChange={(val) => setResultOptions((r) => ({
            ...r,
            mealType: val as MealType,
            page: 0
          }))}>
            <SelectTrigger className="w-[125px]">
              <SelectValue placeholder="Meal Type"/>
            </SelectTrigger>
            <SelectContent>
              {
                mealTypes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1).replaceAll(/([A-Z])/g, " $1")}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
          {
            resultOptions.mealType && (
              <Button 
                variant="destructive"
                onClick={() => setResultOptions((r) => ({ 
                  ...r,
                  mealType: null,
                  page: 0
                }))}
                className="cursor-pointer"
              >
                <X />
              </Button>
            )
          }
        </div>
      </div>
    </div>
  );
}
