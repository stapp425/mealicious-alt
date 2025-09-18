"use client";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { useWatch } from "react-hook-form";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCreateRecipeFormContext } from "@/components/recipes/create/create-recipe-form";
import { ComponentProps } from "react";

type RecipeCuisineProps = {
  readonly cuisines: {
    id: string;
    adjective: string;
    icon: string;
  }[];
};

export default function RecipeCuisine({
  cuisines,
  className,
  ...props
}: RecipeCuisineProps & Omit<ComponentProps<"section">, "children">) {
  const { control, setValue } = useCreateRecipeFormContext();
  const currentCuisine = useWatch({ control, name: "cuisine" });
  
  return (
    <section 
      {...props}
      className={cn(
        "flex flex-col gap-0.5",
        className
      )}
    >
      <h2 className="font-bold text-2xl">
        Cuisine
      </h2>
      <p className="font-semibold text-sm text-muted-foreground">
        Add the type of cuisine for this recipe here. (optional)
      </p>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="cursor-pointer font-normal flex-1 justify-between mt-3 rounded-sm shadow-none"
          >
            {currentCuisine?.adjective || "Select a cuisine"}
            <ChevronDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[clamp(16rem,calc(100vw-2rem),28rem)] p-0" align="end">
          <Command>
            <CommandInput placeholder="Search cuisine..." className="h-9" />
            <CommandList>
              <CommandEmpty>
                No cuisines found.
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                  className="font-semibold p-2"
                  onSelect={() => setValue(
                    "cuisine",
                    undefined,
                    { shouldDirty: true }
                  )}
                >
                  None
                </CommandItem>
                {
                  cuisines.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.adjective}
                      onSelect={(val) => setValue(
                        "cuisine",
                        cuisines.find(({ adjective }) => adjective === val)!,
                        { shouldDirty: true }
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src={c.icon} 
                          alt={`Origin of ${c.adjective} cuisine`}
                          width={35}
                          height={35}
                          className="rounded-full shadow-sm"
                        />
                        {c.adjective}
                      </div>
                      <Check
                        className={cn(
                          "ml-auto",
                          c.id === currentCuisine?.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))
                }
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </section>
  );
}
