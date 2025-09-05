"use client";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { 
  EditRecipeFormSchema,
  MAX_RECIPE_INSTRUCTION_TIME_AMOUNT,
  MAX_RECIPE_INSTRUCTIONS_LENGTH
} from "@/lib/zod/recipe";
import { ArrowDown, ArrowUp, Clock, Info, Pencil, Plus, Trash2 } from "lucide-react";
import { ComponentProps, memo, useCallback, useEffect, useRef, useState } from "react";
import { useFieldArray, useFormState } from "react-hook-form";
import { useEditRecipeFormContext } from "@/components/recipes/edit/edit-recipe-form";
import z from "zod/v4";

const InstructionInputSchema = EditRecipeFormSchema.shape.instructions.element;
type Instruction = z.infer<typeof InstructionInputSchema>;

export default function RecipeInstructions({ className, ...props }: Omit<ComponentProps<"section">, "children">) {
  const { control } = useEditRecipeFormContext();
  const { append, remove, update, swap, fields: formInstructionValues } = useFieldArray({ control, name: "instructions" });
  const [touched, setTouched] = useState<boolean>(false);
  const { 
    isSubmitSuccessful,
    errors: {
      instructions: instructionsError
    }
  } = useFormState({ control, name: "instructions" });
  const errorFocusInput = useRef<HTMLInputElement>(null);

  const [instruction, setInstruction] = useState<Instruction>({
    title: "",
    time: 0,
    description: "",
  });

  const { error: instructionInputError } = InstructionInputSchema.safeParse(instruction);

  const deleteInstruction = useCallback(
    (index: number) => remove(index),
    [remove]
  );

  const resetInstructionInput = useCallback(() => {
    setInstruction({
      title: "",
      time: 0,
      description: ""
    });
    setTouched(false);
  }, [setInstruction, setTouched]);

  useEffect(() => {
    if (instructionsError && !isSubmitSuccessful && document.activeElement?.tagName === "BODY")
      errorFocusInput.current?.focus();
  }, [instructionsError, isSubmitSuccessful]);
  
  return (
    <section 
      {...props}
      className={cn(
        "@container flex flex-col gap-2",
        className
      )}
    >
      <h1 className="text-2xl font-bold required-field">Instructions</h1>
      <p className="font-semibold text-muted-foreground text-sm">
        Add instructions to your recipe here.
      </p>
      <div className="error-text text-xs has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{instructionsError?.message}</span>
      </div>
      <div className="flex justify-between items-end gap-2">
        <Input 
          ref={errorFocusInput}
          value={instruction.title}
          placeholder="Title"
          onChange={(e) => {
            setTouched(true);
            setInstruction((i) => ({
              ...i,
              title: e.target.value
            }));
          }}
          className="rounded-sm shadow-none"
        />
        <Input 
          type="number"
          value={instruction.time}
          min={0}
          max={MAX_RECIPE_INSTRUCTION_TIME_AMOUNT}
          step={1}
          onChange={(e) => {
            setTouched(true);
            setInstruction((i) => ({
              ...i,
              time: Number(e.target.value)
            }));
          }}
          className="w-24 rounded-sm shadow-none"
        />
        <span className="font-semibold">min</span>
      </div>
      <Textarea
        value={instruction.description}
        placeholder="Instruction"
        autoComplete="off"
        onChange={(e) => {
          setTouched(true);
          setInstruction((i) => ({
            ...i,
            description: e.target.value
          }));
        }}
        className="max-h-32 resize-none hyphens-auto rounded-sm shadow-none"
      />
      <div className="error-label flex flex-col gap-2 has-[>ul:empty]:hidden">
        <div className="flex items-center gap-2">
          <Info size={14}/>
          <span className="font-bold text-sm">Input Errors</span>
        </div>
        <Separator className="bg-primary/33 dark:bg-border"/>
        <ul className="flex flex-col gap-1">
          {
            touched && instructionInputError?.issues.map((i) => (
              <li key={i.message} className="text-xs list-inside list-disc">
                {i.message}
              </li>
            ))
          }
        </ul>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!!instructionInputError || formInstructionValues.length > MAX_RECIPE_INSTRUCTIONS_LENGTH}
          onClick={() => {
            append(instruction);
            resetInstructionInput();
          }}
          className="mealicious-button font-semibold text-sm flex justify-center items-center gap-2 py-2 px-6 rounded-sm"
        >
          Add Instruction
          <Plus size={18}/>
        </button>
        <button
          type="button"
          onClick={resetInstructionInput}
          className={cn(
            "cursor-pointer font-semibold text-white text-nowrap text-sm py-2 px-6 rounded-sm transition-colors",
            "bg-red-500 hover:bg-red-700",
            !touched && "hidden"
          )}
        >
          Cancel
        </button>
      </div>
      <div className="flex flex-col gap-2 has-[>ul:empty]:hidden">
        <div className="flex items-center gap-2 text-sm">
          <Info size={16}/>
          <span className={cn(formInstructionValues.length > MAX_RECIPE_INSTRUCTIONS_LENGTH && "text-red-500")}>
            Instruction count: <b>{formInstructionValues.length}</b> / {MAX_RECIPE_INSTRUCTIONS_LENGTH}
          </span>
        </div>
        <ul className="flex-1 flex flex-col gap-3">
          { 
            formInstructionValues.map((i, index) => (
              <RecipeInstruction 
                key={i.id}
                currentInstructionContent={i}
                currentInstructionIndex={index}
                deleteInstruction={deleteInstruction}
                isFirst={index === 0}
                isLast={index === formInstructionValues.length - 1}
                swapInstructionIndex={swap}
                setInstructionContent={update}
              />
            ))
          }
        </ul>
      </div>
    </section>
  );
}

const RecipeInstruction = memo(({ 
  currentInstructionIndex,
  currentInstructionContent,
  isFirst,
  isLast,
  setInstructionContent,
  swapInstructionIndex,
  deleteInstruction,
  className,
  ...props
}: Omit<ComponentProps<"li">, "children"> & {
  currentInstructionIndex: number;
  currentInstructionContent: Instruction;
  isFirst: boolean;
  isLast: boolean;
  setInstructionContent: (index: number, instruction: Instruction) => void;
  swapInstructionIndex: (index: number, otherIndex: number) => void;
  deleteInstruction: (index: number) => void;
}) => {
  const containerRef = useRef<HTMLLIElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [touched, setTouched] = useState(false);
  const [instructionInput, setInstructionInput] = useState<Instruction>(currentInstructionContent);

  const { error: instructionInputError } = InstructionInputSchema.safeParse(instructionInput);
  
  const resetInstructionInput = useCallback(() => {
    setEditMode(false);
    setTouched(false);
    setInstructionInput(currentInstructionContent);
  }, [setEditMode, setTouched, setInstructionInput, currentInstructionContent]);
  
  useEffect(() => {
    if (!editMode) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const element = containerRef.current;
      const targetElement = e.target instanceof Element ? e.target.closest(".instruction-content") : null;
      if (element && targetElement && targetElement !== element) resetInstructionInput();
    };

    document.addEventListener("pointerup", handleOutsideClick);
    return () => document.removeEventListener("pointerup", handleOutsideClick);
  }, [editMode, resetInstructionInput, currentInstructionContent]);
  
  if (editMode) {
    return (
      <li
        ref={containerRef}
        className={cn(
          "instruction-content flex flex-col items-start gap-2 text-left overflow-hidden border border-border rounded-md p-2.5 @min-lg:p-4",
          className
        )}
        {...props}
      >
        <div className="w-full flex justify-between items-center gap-3">
          <div className="bg-mealicious-primary text-white font-semibold size-10 shrink-0 flex justify-center items-center p-3 rounded-full">
            {currentInstructionIndex + 1}
          </div>
          <Input 
            value={instructionInput.title}
            onChange={(e) => {
              setTouched(true);
              setInstructionInput((i) => ({
                ...i,
                title: e.target.value
              }));
            }}
            placeholder="Instruction Title"
            className="rounded-sm shadow-none"
          />
        </div>
        <div className="text-sm text-nowrap flex items-center gap-2">
          <Clock size={18} className="shrink-0 stroke-muted-foreground"/>
          <Input 
            type="number"
            value={instructionInput.time}
            min={0}
            max={MAX_RECIPE_INSTRUCTION_TIME_AMOUNT}
            step={1}
            onChange={(e) => {
              setTouched(true);
              setInstructionInput((i) => ({
                ...i,
                time: Number(e.target.value)
              }));
            }}
            placeholder="0"
            className="w-18 rounded-sm shadow-none"
          />
          mins
        </div>
        <Textarea 
          value={instructionInput.description}
          onChange={(e) => {
            setTouched(true);
            setInstructionInput((i) => ({
              ...i,
              description: e.target.value
            }));
          }}
          placeholder="Instruction Description"
          className="max-h-32 resize-none rounded-sm shadow-none"
        />
        <div className="error-label w-full flex flex-col gap-1 has-[ul:empty]:hidden">
          <div className="flex items-center gap-2">
            <Info size={14}/>
            <span className="font-bold text-sm">Input Errors</span>
          </div>
          <Separator className="bg-primary/33 dark:bg-border"/>
          <ul className="flex flex-col gap-1">
            {
              touched && instructionInputError?.issues.map((i) => (
                <li key={i.path.join("-")} className="text-xs">
                  {i.message}
                </li>
              ))
            }
          </ul>
        </div>
        <div className="w-full @min-2xl:w-auto flex items-center gap-4 @min-2xl:gap-6">
          <button
            type="button"
            disabled={!touched || !!instructionInputError}
            onClick={() => {
              setInstructionContent(currentInstructionIndex, instructionInput);
              setEditMode(false);
              setTouched(false);
            }}
            className="mealicious-button text-xs font-semibold py-2 px-6 rounded-sm"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={resetInstructionInput}
            className="cursor-pointer underline text-xs font-semibold rounded-sm"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li 
      ref={containerRef}
      className={cn(
        "instruction-content flex flex-col items-start gap-3 text-left overflow-hidden border border-border rounded-md p-2.5 @min-lg:p-4",
        className
      )}
      {...props}
    >
      <div className="w-full flex justify-between items-start gap-4">
        <div className="shrink-0 bg-mealicious-primary text-white font-semibold size-10 flex justify-center items-center p-3 rounded-full">
          {currentInstructionIndex + 1}
        </div>
        <div className="w-full flex justify-between items-start gap-2">
          <div className="grid gap-0.5">
            <h2 className="font-bold text-lg hyphens-auto line-clamp-2 -mt-1">{currentInstructionContent.title}</h2>
            <div className="font-semibold text-sm text-nowrap flex items-center gap-1.5 text-muted-foreground">
              <Clock size={14}/>
              {Math.floor(currentInstructionContent.time)} mins
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className={cn(
              "group cursor-pointer size-8 shrink-0",
              "border border-muted-foreground text-muted-foreground",
              "hover:text-white hover:bg-mealicious-primary hover:border-mealicious-primary",
              "flex justify-center items-center",
              "rounded-full transition-colors"
            )}
          >
            <Pencil size={16} className="shrink-0"/>
          </button>
        </div>
      </div>
      <p className="flex-1 text-left break-all">{currentInstructionContent.description}</p>
      <div className="w-full h-8 flex justify-between @min-md:justify-start items-center gap-3">
        <button
          type="button"
          disabled={isFirst || editMode}
          onClick={() => swapInstructionIndex(currentInstructionIndex, currentInstructionIndex - 1)}
          className={cn(
            "flex-1 @min-md:flex-none shrink-0 h-8",
            "mealicious-button font-semibold text-xs text-nowrap",
            "flex justify-center items-center gap-1.5",
            "py-2 px-3 rounded-full"
          )}
        >
          <ArrowUp size={14}/>
          Move Up
        </button>
        <button
          type="button"
          disabled={isLast || editMode}
          onClick={() => swapInstructionIndex(currentInstructionIndex, currentInstructionIndex + 1)}
          className={cn(
            "flex-1 @min-md:flex-none shrink-0 h-8",
            "mealicious-button font-semibold text-xs text-nowrap",
            "flex justify-center items-center gap-1.5",
            "py-2 px-3 rounded-full"
          )}
        >
          <ArrowDown size={14}/>
          Move Down
        </button>
        <Separator orientation="vertical" className="grow-0"/>
        <button
          type="button"
          disabled={editMode}
          onClick={() => deleteInstruction(currentInstructionIndex)}
          className={cn(
            "group flex-1 @min-md:flex-none shrink-0 cursor-pointer h-8",
            "border border-muted-foreground hover:border-red-700 hover:bg-red-700",
            "font-semibold text-xs text-nowrap text-muted-foreground hover:text-white",
            "flex justify-center items-center gap-1.5",
            "py-2 px-3 rounded-full transition-colors"
          )}
        >
          <Trash2 size={14} className="stroke-muted-foreground group-hover:stroke-white"/>
          Delete
        </button>
      </div>
    </li>
  );
});

RecipeInstruction.displayName = "RecipeInstruction";
