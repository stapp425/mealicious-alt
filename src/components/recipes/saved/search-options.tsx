"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { filters as filtersEnum, Sort, sorts } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SavedRecipeSearch } from "@/lib/zod/recipe";
import { ChevronDown, Funnel } from "lucide-react";
import { ComponentProps } from "react";
import { Control, UseFormSetValue, useWatch } from "react-hook-form";

export default function SearchOptions({
  control,
  setValue,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  control: Control<SavedRecipeSearch>;
  setValue: UseFormSetValue<SavedRecipeSearch>;
}) {
  const [sort, filters] = useWatch({ control, name: ["sort", "filters"] });

  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <button className={cn(
          "group/options cursor-pointer w-fit flex items-center gap-2",
          "text-mealicious-primary [&>svg]:fill-mealicious-primary font-semibold text-sm"
        )}>
          <Funnel size={16}/>
          <span className="group-hover/options:underline">Search Options</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        align="start"
        sideOffset={7.5}
        className="w-[min(28rem,calc(100vw-2rem))] p-0"
      >
        <div className="font-bold p-3">
          Search Options
        </div>
        <Separator />
        <div 
          className={cn("grid gap-3 p-3", className)}
          {...props}
        >
          <div className="grid gap-3">
            <div className="h-6 flex justify-between items-center gap-3">
              <h2 className="font-semibold -mb-1">Sort By</h2>
              {
                sort && (
                  <Button 
                    variant="destructive"
                    onClick={() => setValue("sort", undefined)}
                    className="h-full text-xs cursor-pointer rounded-sm"
                  >
                    Clear
                  </Button>
                )
              }
            </div>
            <Select 
              value={sort || ""}
              onValueChange={(val) => setValue(
                "sort",
                val as Sort,
                { shouldDirty: true }
              )}
            >
              <SelectTrigger className="w-full capitalize rounded-sm shadow-none">
                <SelectValue placeholder="Select an option"/>
              </SelectTrigger>
              <SelectContent>
                {
                  sorts.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.replaceAll(/([A-Z])/g, " $1")}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <div className="h-6 flex justify-between items-center gap-3">
              <h2 className="font-semibold -mb-1">Filter By</h2>
              {
                filters.length > 0 && (
                  <Button 
                    variant="destructive"
                    onClick={() => setValue(
                      "filters",
                      [],
                      { shouldDirty: true }
                    )}
                    className="h-full text-xs cursor-pointer rounded-sm"
                  >
                    Clear
                  </Button>
                )
              }
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(
                "w-full cursor-pointer flex items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm whitespace-nowrap shadow-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50",
                "[&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-0.75",
                "border border-input outline-none bg-transparent dark:bg-input/30 dark:hover:bg-input/50",
                "data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 data-[placeholder]:text-muted-foreground"
              )}>
                Filters
                <ChevronDown />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[min(26.5rem,calc(100vw-3.5rem))]"
              >
                {
                  filtersEnum.map((f) => (
                    <DropdownMenuCheckboxItem
                      key={f}
                      checked={filters.includes(f)}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(val) => {
                        setValue(
                          "filters", 
                          val
                            ? [...new Set([...filters, f])]
                            : [...filters.filter((ff) => ff !== f)],
                          { shouldDirty: true }
                        );
                      }}
                      className="capitalize"
                    >
                      {f}
                    </DropdownMenuCheckboxItem>
                  ))
                }
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
