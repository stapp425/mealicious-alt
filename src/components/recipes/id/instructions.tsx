"use client";

import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getRecipeInstructions } from "@/lib/actions/recipe";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, Check, Clock, Flag, Info, ListCheck, MapPin, PartyPopper, Pencil, RotateCcw, X } from "lucide-react";
import { ComponentProps, useRef, useState } from "react";

type InstructionState = "active" | "completed" | "incomplete";

export default function Instructions({ 
  recipeId,
  className,
  ...props
}: Omit<ComponentProps<"section">, "children"> & {
  recipeId: string;
}) {
  // instructions will be tracked by id since each instruction has a unique id
  const activeInstructionRef = useRef<HTMLLIElement>(null);
  const [completedInstructions, setCompletedInstructions] = useState(() => new Set<string>());
  const [activeInstruction, setActiveInstruction] = useState<string | null>(null);
  const [cookMode, setCookMode] = useState(false);
  
  const { 
    data: instructions,
    isLoading: instructionsLoading,
    error: instructionsError
  } = useQuery({
    queryKey: ["recipe-details", recipeId, { type: "instructions" }],
    queryFn: () => getRecipeInstructions(recipeId),
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  if (instructionsError) {
    return (
      <section className="error-label flex items-center gap-2 p-2">
        <Info size={16}/>
        There was an error while fetching instructions content.
      </section>
    );
  }

  if (instructionsLoading || !instructions) {
    return (
      <section className="@container flex flex-col gap-2.5">
        <Skeleton className="w-32 h-8 rounded-sm"/>
        <Skeleton className="h-22 rounded-sm"/>
        <div className="grid gap-3">
          {
            Array.from({ length: 8 }, (_, i) => i).map((i) => (
              <Skeleton key={i} className="h-30 rounded-sm"/>
            ))
          }
        </div>
      </section>
    );
  }

  const progressValue = Math.floor(completedInstructions.size / instructions.length * 100);
  const remainingInstructions = instructions.length - completedInstructions.size;
  
  return (
    <section 
      data-cook-mode={cookMode ? "enabled" : "disabled"}
      className={cn(
        "@container group/instructions flex flex-col gap-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Info size={16} className="cursor-pointer"/>
          </PopoverTrigger>
          <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
            Specific directions on how to create a recipe. Make sure to follow as closely as possible for optimal results.
          </PopoverContent>
        </Popover>
        <h2 className="font-bold text-xl">Instructions</h2>
      </div>
      <div className="border border-border flex flex-col gap-3 p-4 rounded-sm">
        <h2 className="font-bold text-lg">Options</h2>
        <Label className="flex items-center gap-4">
          <Switch
            checked={cookMode}
            onCheckedChange={setCookMode}
          />
          <div className="flex flex-col gap-0.5">
            <span>Cook Mode</span>
            <span className="text-muted-foreground text-xs">Allows for progress tracking</span>
          </div>
        </Label>
        <div className="flex flex-col gap-2 group-data-[cook-mode=disabled]/instructions:hidden">
          <div className="relative mx-auto my-3.5 w-full">
            <Progress value={progressValue}/>
            <div className={cn(
              "absolute top-1/2 -translate-y-1/2 right-0 bg-mealicious-primary flex justify-center items-center p-2 rounded-full transition-all",
              "[&>svg]:shrink-0 [&>svg]:size-4 [&>svg]:stroke-white"
            )}>
              <Flag />
            </div>
            <div 
              className={cn(
                "absolute top-1/2 -translate-y-1/2 bg-mealicious-primary flex justify-center items-center p-2 rounded-full transition-all",
                "[&>svg]:shrink-0 [&>svg]:size-4 [&>svg]:stroke-white"
              )}
              style={{ 
                left: `${progressValue}%`,
                transform: `translateX(-${progressValue}%)`
              }}
            >
              <MapPin />
            </div>
          </div>
          <h2 className="font-bold">Completed instructions: {completedInstructions.size} / {instructions.length}</h2>
          <h3 className={cn(
            "text-muted-foreground text-sm",
            (completedInstructions.size <= 0 || completedInstructions.size >= instructions.length) && "hidden"
          )}>
            Keep it up! You have <b className="font-bold text-mealicious-primary">{remainingInstructions}</b> {remainingInstructions !== 1 ? "instructions" : "instruction"} remaining.
          </h3>
          <div className={cn(
            "flex items-center gap-2 text-muted-foreground",
            completedInstructions.size !== instructions.length && "hidden"
          )}>
            <PartyPopper size={16}/>
            <h3 className="text-sm">
              Congratulations! You finished creating this recipe.
            </h3>
          </div>
          <div className="flex flex-col @min-md:flex-row items-center gap-2">
            <button
              onClick={() => {
                const activeInstructionElement = activeInstructionRef.current;
                if (!activeInstructionElement) return;

                const elementRect = activeInstructionElement.getBoundingClientRect();
                const bodyRect = document.body.getBoundingClientRect();

                scrollTo({
                  top: elementRect.top - bodyRect.top - 90,
                  behavior: "smooth"
                });
              }}
              className={cn(
                "mealicious-button w-full @min-md:w-fit font-semibold text-xs flex justify-center items-center gap-2 py-2 px-4 rounded-sm",
                !activeInstruction && "hidden"
              )}
            >
              <ArrowDown size={16}/>
              <span>Scroll to Active Instruction</span>
            </button>
            <button
              onClick={() => {
                setCompletedInstructions(new Set());
                setActiveInstruction(null);
                activeInstructionRef.current = null;
              }}
              className={cn(
                "cursor-pointer w-full @min-md:w-fit border border-border text-xs text-white font-semibold py-2 px-4 rounded-sm transition-colors [&>svg]:size-4",
                "flex justify-center items-center mt-1.25 gap-2",
                "group-data-[state=incomplete]/instruction:hidden",
                "border-red-500 bg-red-500",
                "dark:border-red-700 dark:bg-red-700",
                "hover:bg-red-600 hover:border-red-600 dark:hover:bg-red-800 dark:hover:border-red-800",
                (!activeInstruction && completedInstructions.size === 0) && "hidden"
              )}
            >
              <RotateCcw size={16}/>
              <span>Reset Progress</span>
            </button>
          </div>
          
        </div>
      </div>
      <ul className="flex flex-col gap-3 empty:hidden">
        { 
          instructions.map((i) => {
            const state: InstructionState = activeInstruction === i.id
              ? "active"
              : completedInstructions.has(i.id)
                ? "completed"
                : "incomplete";

            let StateIcon: typeof Check;
            let stateIconClassName: string;

            switch (state) {
              case "active":
                StateIcon = Pencil;
                stateIconClassName = "bg-green-500";
                break;
              case "completed":
                StateIcon = Check;
                stateIconClassName = "bg-mealicious-primary";
                break;
              default:
                StateIcon = X;
                stateIconClassName = "bg-red-500";
            }
            
            return (
              <li
                key={i.id}
                ref={state === "active" ? activeInstructionRef : undefined}
                data-state={state}
                className={cn(
                  "group/instruction flex flex-col items-start gap-3 text-left overflow-hidden group border border-border rounded-md p-4 transition-colors",
                  "data-[state=active]:group-data-[cook-mode=enabled]/instructions:border-green-400 data-[state=active]:group-data-[cook-mode=enabled]/instructions:bg-green-300/33 dark:data-[state=active]:group-data-[cook-mode=enabled]/instructions:bg-green-300/10",
                  "data-[state=completed]:group-data-[cook-mode=enabled]/instructions:border-mealicious-primary data-[state=completed]:group-data-[cook-mode=enabled]/instructions:bg-mealicious-primary/20 dark:data-[state=completed]:group-data-[cook-mode=enabled]/instructions:bg-mealicious-primary/15"
                )}
              >
                <div className="w-full space-x-4">
                  <div className={cn(
                    "float-left bg-mealicious-primary text-white font-semibold size-10 flex justify-center items-center p-3 rounded-full",
                    "group-data-[state=active]/instruction:bg-green-500"
                  )}>
                    {i.index}
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5 items-start">
                    <div className="w-full flex justify-between items-start gap-1">
                      <div className="flex flex-col">
                        <h2 className="font-bold text-lg hyphens-auto line-clamp-3 -mt-1 capitalize">{i.title}</h2>
                        <div className="font-semibold text-sm text-nowrap flex items-center gap-1.5 text-muted-foreground">
                          <Clock size={14}/>
                          <span className="mt-0.75">{Math.floor(i.time)} mins</span>
                        </div>
                      </div>
                      <div className="hidden @min-xl:group-data-[cook-mode=enabled]/instructions:flex items-center gap-2">
                        <span className="text-sm @min-2xl:text-base font-semibold capitalize">
                          {state}
                        </span>
                        <div className={cn(
                          "size-8 flex justify-center items-center gap-1.5 rounded-full [&>svg]:size-4 [&>svg]:stroke-white",
                          stateIconClassName
                        )}>
                          <StateIcon />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden @max-xl:group-data-[cook-mode=enabled]/instructions:flex items-center gap-2">
                  <div className={cn(
                    "size-6 flex justify-center items-center gap-1.5 rounded-full [&>svg]:size-4 [&>svg]:stroke-white",
                    stateIconClassName
                  )}>
                    <StateIcon />
                  </div>
                  <span className="text-sm @min-2xl:text-base font-semibold capitalize">
                    {state}
                  </span>
                </div>
                <div className="w-full flex flex-col @min-md:flex-row @min-md:items-center gap-2 group-data-[cook-mode=disabled]/instructions:hidden">
                  <button
                    onClick={() => {
                      setCompletedInstructions((c) => new Set([...c, i.id]));
                      if (i.id === activeInstruction) setActiveInstruction(null);
                    }}
                    className={cn(
                      "cursor-pointer border border-border text-xs text-white font-semibold py-2 px-4 rounded-sm transition-colors [&>svg]:size-4",
                      "flex justify-center items-center gap-2",
                      "group-data-[state=completed]/instruction:hidden",
                      "group-not-data-[state=completed]/instruction:border-mealicious-primary group-not-data-[state=completed]/instruction:bg-mealicious-primary",
                      "hover:bg-mealicious-primary-hover hover:border-mealicious-primary-hover"
                    )}
                  >
                    <ListCheck />
                    Mark as Complete
                  </button>
                  <button
                    onClick={() => {
                      setActiveInstruction(i.id);
                      setCompletedInstructions((c) => new Set([...c].filter((c) => c !== i.id)));
                    }}
                    className={cn(
                      "cursor-pointer border border-border text-xs text-white font-semibold py-2 px-4 rounded-sm transition-colors [&>svg]:size-4",
                      "flex justify-center items-center gap-2",
                      "group-data-[state=active]/instruction:hidden",
                      "group-not-data-[state=active]/instruction:border-green-500 group-not-data-[state=active]/instruction:bg-green-500",
                      "dark:group-not-data-[state=active]/instruction:border-green-600 dark:group-not-data-[state=active]/instruction:bg-green-600",
                      "hover:bg-green-600 hover:border-green-600 dark:hover:bg-green-700 dark:hover:border-green-700"
                    )}
                  >
                    <Check />
                    Mark as Active
                  </button>
                  <button
                    onClick={() => {
                      setCompletedInstructions((c) => new Set([...c].filter((c) => c !== i.id)));
                      if (i.id === activeInstruction) setActiveInstruction(null);
                    }}
                    className={cn(
                      "cursor-pointer border border-border text-xs text-white font-semibold py-2 px-4 rounded-sm transition-colors [&>svg]:size-4",
                      "flex justify-center items-center gap-2",
                      "group-data-[state=incomplete]/instruction:hidden",
                      "group-not-data-[state=incomplete]/instruction:border-red-500 group-not-data-[state=incomplete]/instruction:bg-red-500",
                      "dark:group-not-data-[state=incomplete]/instruction:border-red-700 dark:group-not-data-[state=incomplete]/instruction:bg-red-700",
                      "hover:bg-red-600 hover:border-red-600 dark:hover:bg-red-800 dark:hover:border-red-800"
                    )}
                  >
                    <X />
                    Mark as Incomplete
                  </button>
                </div>
                <p className="flex-1 text-left hyphens-auto text-secondary-foreground">{i.description}</p>
              </li>
            );
          })
        }
      </ul>
    </section>
  );
}
