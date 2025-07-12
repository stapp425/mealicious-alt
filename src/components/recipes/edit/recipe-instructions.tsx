"use client";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_INSTRUCTION_CONTENT_LENGTH, MAX_INSTRUCTION_TIME_AMOUNT, MAX_INSTRUCTION_TITLE_LENGTH, MAX_INSTRUCTIONS_LENGTH } from "@/lib/zod";
import { ArrowDown, ArrowUp, Clock, Info, Pencil, Plus, Trash2 } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray } from "react-hook-form";
import z from "zod";
import { useEditRecipeFormContext } from "@/components/recipes/edit/edit-recipe-form";

type Instruction = z.infer<typeof InstructionInputSchema>;

const InstructionInputSchema = z.object({
  title: z.string({
    required_error: "An instruction title is required."
  }).nonempty({
    message: "Instruction title cannot be empty."
  }).max(MAX_INSTRUCTION_TITLE_LENGTH, {
    message: `Instruction title length cannot exceed ${MAX_INSTRUCTION_TITLE_LENGTH.toLocaleString()} characters.`
  }),
  time: z.coerce.number({
    required_error: "An instruction time is required."
  }).positive({
    message: "Instruction time must be positive."
  }).max(MAX_INSTRUCTION_TIME_AMOUNT, {
    message: `Instruction time cannot exceed ${MAX_INSTRUCTION_TIME_AMOUNT.toLocaleString()}.`
  }),
  description: z.string({
    required_error: "A description is required."
  }).nonempty({
    message: "Description cannot be empty."
  }).max(MAX_INSTRUCTION_CONTENT_LENGTH, {
    message: `A maximum of ${MAX_INSTRUCTION_CONTENT_LENGTH.toLocaleString()} characters are allowed.`
  })
});

export default function RecipeInstructions() {
  const { control, errors } = useEditRecipeFormContext();
  const { append, remove, update, swap, fields: formInstructionValues } = useFieldArray({ control, name: "instructions" });
  const [touched, setTouched] = useState<boolean>(false);

  const [instruction, setInstruction] = useState<Instruction>({
    title: "",
    time: 0,
    description: "",
  });

  const parsedInstruction = InstructionInputSchema.safeParse(instruction);
  const error = parsedInstruction.error?.errors[0]?.message;

  const deleteInstruction = useCallback((index: number) => remove(index), []);
  const setInstructionContent = useCallback(
    (index: number, instruction: Instruction) => update(index, instruction),
    []
  );
  
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold required-field">Instructions</h1>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
        <p className="font-semibold text-muted-foreground">
          Add instructions to your recipe here.
        </p>
        <span className={cn(instruction.description.length > MAX_INSTRUCTION_CONTENT_LENGTH && "text-red-500")}>
          <b className="text-xl">{instruction.description.length}</b> / {MAX_INSTRUCTION_CONTENT_LENGTH}
        </span>
      </div>
      {
        (touched && error) && (
          <div className="error-text">
            <Info size={14}/>
            {error}
          </div>
        )
      }
      <div className="flex justify-between items-end gap-2">
        <Input 
          value={instruction.title}
          placeholder="Add a title here..."
          onChange={(e) => {
            const { value } = e.target;
            if (!touched) setTouched(true);
            setInstruction((i) => ({
              ...i,
              title: value
            }));
          }}
        />
        <Input 
          value={instruction.time}
          type="number"
          min={0}
          max={MAX_INSTRUCTION_TIME_AMOUNT}
          onChange={(e) => {
            const { value } = e.target;
            if (!touched) setTouched(true);
            setInstruction((i) => ({
              ...i,
              time: Number(value)
            }));
          }}
          className="w-[100px]"
        />
        <span className="font-semibold">min</span>
      </div>
      <Textarea
        value={instruction.description}
        placeholder="Add an instruction here..."
        autoComplete="off"
        onChange={(e) => {
          if (!touched) setTouched(true);
          setInstruction((i) => ({
            ...i,
            description: e.target.value
          }));
        }}
        className="resize-y hyphens-auto"
      />
      <button
        type="button"
        disabled={!parsedInstruction.success}
        onClick={() => {
          append(instruction);
          setInstruction({
            title: "",
            time: 0,
            description: ""
          });
          setTouched(false);
        }}
        className="mealicious-button font-semibold flex justify-center items-center gap-3 py-2 rounded-md"
      >
        Add Instruction
        <Plus size={18}/>
      </button>
      {
        formInstructionValues.length > 0 && (
          <>
          <div className="flex items-center gap-2 text-sm">
            <Info size={16}/>
            <span className={cn(formInstructionValues.length > MAX_INSTRUCTIONS_LENGTH && "text-red-500")}>
              Instruction count: <b>{formInstructionValues.length}</b> / {MAX_INSTRUCTIONS_LENGTH}
            </span>
          </div>
          <div className="flex-1 flex flex-col gap-3">
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
                  setInstructionContent={setInstructionContent}
                />
              ))
            }
          </div>
          </>
        )
      }
      { 
        errors.instructions?.message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {errors.instructions.message}
          </div> 
        )
      }
    </div>
  );
}

type RecipeInstructionProps = {
  currentInstructionIndex: number;
  currentInstructionContent: Instruction;
  isFirst: boolean;
  isLast: boolean;
  setInstructionContent: (index: number, instruction: Instruction) => void;
  swapInstructionIndex: (index: number, otherIndex: number) => void;
  deleteInstruction: (index: number) => void;
};

const RecipeInstruction = memo(({ 
  currentInstructionIndex,
  currentInstructionContent,
  isFirst,
  isLast,
  setInstructionContent,
  swapInstructionIndex,
  deleteInstruction
}: RecipeInstructionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [instructionInput, setInstructionInput] = useState<Instruction>(currentInstructionContent);

  const error = useMemo(
    () => InstructionInputSchema.safeParse(instructionInput).error?.errors[0].message || (
      instructionInput.title === currentInstructionContent.title &&
      instructionInput.description === currentInstructionContent.description && 
      instructionInput.time === currentInstructionContent.time
    ) && "Content cannot be similar." as string || undefined,
    [instructionInput, currentInstructionContent]
  );
  
  useEffect(() => {
    if (!editMode) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const element = containerRef.current;
      const targetElement = e.target instanceof Element ? e.target.closest(".instruction-content") : null;
      if (element && targetElement && targetElement !== element) {
        setEditMode(false);
        setInstructionInput(currentInstructionContent);
      }
    };

    document.addEventListener("pointerup", handleOutsideClick);
    return () => document.removeEventListener("pointerup", handleOutsideClick);
  }, [editMode, currentInstructionContent]);

  return (
    <div ref={containerRef} className="instruction-content flex flex-col items-start gap-3 text-left overflow-hidden border border-border rounded-md p-4 shadow-sm">
      {
        editMode ? (
          <>
          <div className="w-full flex justify-between items-center gap-3">
            <div className="bg-mealicious-primary size-10 shrink-0 flex justify-center items-center p-3 rounded-full">
              {currentInstructionIndex + 1}
            </div>
            <Input 
              value={instructionInput.title}
              onChange={(e) => setInstructionInput((i) => ({
                ...i,
                title: e.target.value
              }))}
              placeholder="Instruction Title"
              className="font-bold"
            />
          </div>
          <div className="text-sm text-nowrap flex items-center gap-2">
            <Clock size={18} className="shrink-0 stroke-muted-foreground"/>
            <Input 
              type="number"
              value={instructionInput.time}
              onChange={(e) => setInstructionInput((i) => ({
                ...i,
                time: Number(e.target.value)
              }))}
              placeholder="0"
              className="w-18"
            />
            mins
          </div>
          <span className={cn(instructionInput.description.length > MAX_INSTRUCTION_CONTENT_LENGTH && "text-red-500")}>
            <b className="text-xl">{instructionInput.description.length}</b> / {MAX_INSTRUCTION_CONTENT_LENGTH}
          </span>
          <Textarea 
            value={instructionInput.description}
            onChange={(e) => setInstructionInput((i) => ({
              ...i,
              description: e.target.value
            }))}
            placeholder="Instruction Description"
          />
          <div className="w-full flex justify-end items-center gap-6">
            {
              error && (
                <div className="error-text text-sm mr-auto">
                  <Info size={16}/>
                  {error}
                </div> 
              )
            }
            <button
              type="button"
              onClick={() => {
                setEditMode(false);
                setInstructionInput(currentInstructionContent);
              }}
              className="cursor-pointer underline text-xs font-semibold rounded-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!!error}
              onClick={() => {
                setInstructionContent(currentInstructionIndex, instructionInput);
                setEditMode(false);
              }}
              className="mealicious-button text-xs font-semibold py-2 px-6 rounded-sm"
            >
              Edit
            </button>
          </div>
          </>
        ) : (
          <>
          <div className="w-full flex justify-between items-start gap-4">
            <div className="shrink-0 bg-mealicious-primary size-10 flex justify-center items-center p-3 rounded-full">
              {currentInstructionIndex + 1}
            </div>
            <div className="flex-1 flex flex-col gap-0.5 items-start">
              <div className="w-full flex justify-between items-start gap-2">
                <h2 className="font-bold text-lg hyphens-auto line-clamp-2 -mt-1">{currentInstructionContent.title}</h2>
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="group cursor-pointer size-8 shrink-0 border border-foreground hover:bg-mealicious-primary hover:border-mealicious-primary flex justify-center items-center rounded-full transition-colors"
                >
                  <Pencil size={16} className="shrink-0"/>
                </button>
              </div>
              <div className="font-semibold text-sm text-nowrap flex items-center gap-1.5 text-muted-foreground">
                <Clock size={14}/>
                {Math.floor(currentInstructionContent.time)} mins
              </div>
            </div>
          </div>
          <p className="flex-1 text-left break-all">{currentInstructionContent.description}</p>
          <div className="w-full h-8 flex justify-between sm:justify-start items-center gap-3">
            <button
              type="button"
              disabled={isFirst || editMode}
              onClick={() => swapInstructionIndex(currentInstructionIndex, currentInstructionIndex - 1)}
              className="flex-1 sm:flex-none shrink-0 mealicious-button font-semibold text-xs text-nowrap flex justify-center items-center gap-1.5 py-2 px-3 h-8 rounded-full"
            >
              <ArrowUp size={14}/>
              Move Up
            </button>
            <button
              type="button"
              disabled={isLast || editMode}
              onClick={() => swapInstructionIndex(currentInstructionIndex, currentInstructionIndex + 1)}
              className="flex-1 sm:flex-none shrink-0 mealicious-button font-semibold text-xs text-nowrap flex justify-center items-center gap-1.5 py-2 px-3 h-8 rounded-full"
            >
              <ArrowDown size={14}/>
              Move Down
            </button>
            <Separator orientation="vertical" className="grow-0"/>
            <button
              type="button"
              disabled={editMode}
              onClick={() => deleteInstruction(currentInstructionIndex)}
              className="group flex-1 sm:flex-none shrink-0 cursor-pointer hover:bg-red-700 hover:text-white hover:border-red-700 border border-muted-foreground font-semibold text-xs text-nowrap flex justify-center items-center gap-1.5 py-2 px-3 h-8 rounded-full transition-colors"
            >
              <Trash2 size={14} className="stroke-muted-foreground group-hover:stroke-white"/>
              Delete
            </button>
          </div>
          </>
        )
      }
    </div>
  );
});

RecipeInstruction.displayName = "RecipeInstruction";
