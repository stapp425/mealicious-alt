"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Clock, Info, X } from "lucide-react";
import { parseAsIndex, parseAsInteger, useQueryState } from "nuqs";

type InstructionsProps = {
  instructions: {
    id: string;
    title: string;
    time: string;
    index: number;
    description: string;
  }[];
};

export default function Instructions({ instructions }: InstructionsProps) {
  const [page, setPage] = useQueryState(
    "currentInstructionPage",
    parseAsIndex.withDefault(0)
  );
  const [displayLimit, setDisplayLimit] = useQueryState(
    "instructionDisplayLimit",
    parseAsInteger.withDefault(0)
  );

  const totalPages = Math.ceil(instructions.length / displayLimit);
  const isFirstPage = page === 0;
  const isLastPage = page === totalPages - 1;
  const startIndex = displayLimit * page;
  const endIndex = startIndex + displayLimit;
  
  return (
    <section className="flex flex-col gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-xl">Instructions</h2>
            <Info size={16} className="cursor-pointer"/>
          </div>
        </PopoverTrigger>
        <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
          Specific directions on how to create a recipe. Make sure to follow as close as possible for optimal results.
        </PopoverContent>
      </Popover>
      <Separator />
      <div className="flex justify-between items-end">
        <div className="flex flex-col items-start gap-3">
          <h2 className="font-semibold">Display Limit</h2>
          <div className="flex items-center gap-2">
            <Input 
              type="number"
              value={displayLimit}
              min={0}
              max={instructions.length}
              onChange={(e) => {
                const { value } = e.target;
                if (Number(value) > instructions.length || Number(value) < 0) {
                  setPage(0);
                  return;
                }

                setDisplayLimit(Number(value));
              }}
              className="w-[75px]"
            />
            {
              displayLimit !== 0 && (
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setDisplayLimit(0);
                    setPage(0);
                  }}
                  className="cursor-pointer flex items-center gap-1"
                >
                  <X />
                  <span className="hidden md:block">Clear</span>
                </Button>
              )
            }
          </div>
        </div>
        {
          (displayLimit > 0 && displayLimit < instructions.length) && (
            <div className="flex gap-2 items-center">
              <button 
                disabled={isFirstPage}
                onClick={() => setPage((p) => p - 1)}
                className="mealicious-button font-semibold text-sm flex items-center gap-1 py-2 px-2 md:px-4 rounded-sm">
                <ChevronLeft />
                <span className="hidden md:block">Previous</span>
              </button>
              <button
                disabled={isLastPage}
                onClick={() => setPage((p) => p + 1)}
                className="mealicious-button font-semibold text-sm flex items-center gap-1 py-2 px-2 md:px-4 rounded-sm"
              >
                <span className="hidden md:block">Next</span>
                <ChevronRight />
              </button>
            </div>
          )
        }
      </div>
      <ul className="flex flex-col gap-3">
        { 
          (displayLimit > 0 ? instructions.slice(startIndex, endIndex) : instructions).map((i) => (
            <li
              key={i.id}
              className="flex flex-col items-start gap-3 text-left overflow-hidden group border border-border rounded-md p-3 transition-colors"
            >
              <div className="w-full flex justify-between items-start gap-4">
                <div className="bg-mealicious-primary text-white font-semibold size-10 flex justify-center items-center p-3 rounded-full">
                  {i.index}
                </div>
                <div className="flex-1 flex flex-col gap-0.5 items-start">
                  <h2 className="font-bold text-lg hyphens-auto line-clamp-2 -mt-1">{i.title}</h2>
                  <div className="font-semibold text-sm text-nowrap flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={14}/>
                    {Math.floor(Number(i.time))} mins
                  </div>
                </div>
              </div>
              <p className="flex-1 text-left hyphens-auto text-secondary-foreground">{i.description}</p>
            </li>
          ))
        }
      </ul>
    </section>
  );
}