"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { filters, Sort, sorts } from "@/lib/types";
import { ChevronDown, X } from "lucide-react";
import { parseAsArrayOf, parseAsIndex, parseAsStringLiteral, useQueryStates } from "nuqs";

export default function ResultOptions() {
  const [resultOptions, setResultOptions] = useQueryStates({
    page: parseAsIndex.withDefault(0),
    sort: parseAsStringLiteral(sorts),
    filters: parseAsArrayOf(parseAsStringLiteral(filters)).withDefault([])
  }, {
    shallow: false
  });

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold">Search Options</h2>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Select value={resultOptions.sort || ""} onValueChange={(val) => setResultOptions((r) => ({
            ...r,
            sort: val as Sort,
            page: 0
          }))}>
            <SelectTrigger className="w-[125px]">
              <SelectValue placeholder="Sort by..."/>
            </SelectTrigger>
            <SelectContent>
              {
                sorts.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1).replaceAll(/([A-Z])/g, " $1")}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
          {
            resultOptions.sort && (
              <Button 
                variant="destructive"
                onClick={() => setResultOptions((r) => ({ 
                  ...r,
                  sort: null,
                  page: 0
                }))}
                className="cursor-pointer"
              >
                <X />
              </Button>
            )
          }
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-[125px] cursor-pointer border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
              Filters
              <ChevronDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {
                filters.map((f) => (
                  <DropdownMenuCheckboxItem
                    key={f}
                    checked={resultOptions.filters.includes(f)}
                    onCheckedChange={(val) => {
                      setResultOptions((r) => ({
                        ...r,
                        page: 0,
                        filters: val
                          ? [...new Set([...resultOptions.filters, f])]
                          : [...r.filters.filter((ff) => ff !== f)]
                      }));
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1).replaceAll(/([A-Z])/g, " $1")}
                  </DropdownMenuCheckboxItem>
                ))
              }
            </DropdownMenuContent>
          </DropdownMenu>
          {
            resultOptions.filters.length > 0 && (
              <Button 
                variant="destructive"
                onClick={() => setResultOptions((r) => ({ 
                  ...r,
                  filters: [],
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
