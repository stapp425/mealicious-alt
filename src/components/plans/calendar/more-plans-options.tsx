"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MorePlansTimeFrame, morePlansTimeFrame, morePlansView, MorePlansView } from "@/lib/types";
import { X } from "lucide-react";
import { parseAsIndex, parseAsStringLiteral, useQueryStates } from "nuqs";

export default function MorePlansOptions() {
  const [{ view, timeframe }, setOptions] = useQueryStates({
    view: parseAsStringLiteral(morePlansView).withDefault("upcoming"),
    timeframe: parseAsStringLiteral(morePlansTimeFrame),
    page: parseAsIndex.withDefault(0)
  }, {
    shallow: false,
    urlKeys: {
      view: "mode"
    }
  });
  
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-bold text-xl">Result Options</h2>
      <div className="flex items-center gap-2">
        <Select value={view} onValueChange={(val: MorePlansView) => setOptions((o) => ({ ...o, view: val, page: 0 }))}>
          <SelectTrigger className="capitalize">
            <SelectValue placeholder="Select a mode..."/>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {
                morePlansView.map((v) => (
                  <SelectItem key={v} value={v} className="capitalize">
                    {v}
                  </SelectItem>
                ))
              }
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={timeframe || ""} onValueChange={(val: MorePlansTimeFrame) => setOptions((o) => ({ ...o, timeframe: val, page: 0 }))}>
          <SelectTrigger className="capitalize">
            <SelectValue placeholder="Select a timeframe..."/>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {
                morePlansTimeFrame.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t}
                  </SelectItem>
                ))
              }
            </SelectGroup>
          </SelectContent>
        </Select>
        {
          timeframe && (
            <Button 
              variant="destructive"
              onClick={() => setOptions((o) => ({ 
                ...o,
                timeframe: null,
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
  );
}
