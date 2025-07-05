"use client";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_INSTRUCTION_CONTENT_LENGTH, MAX_INSTRUCTION_TIME_AMOUNT, MAX_INSTRUCTION_TITLE_LENGTH, MAX_INSTRUCTIONS_LENGTH, RecipeEdition } from "@/lib/zod";
import { ArrowDown, ArrowUp, Clock, Info, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import z from "zod";

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
  const {
    control,
    formState: {
      errors
    }
  } = useFormContext<RecipeEdition>();
  const { append, remove, swap } = useFieldArray({ control, name: "instructions" });
  const formInstructionValues = useWatch({ control, name: "instructions" });
  const [isTouched, setIsTouched] = useState<boolean>(false);

  const [instruction, setInstruction] = useState<z.infer<typeof InstructionInputSchema>>({
    title: "",
    time: 0,
    description: "",
  });

  const parsedInstruction = InstructionInputSchema.safeParse(instruction);
  const error = parsedInstruction.error?.errors[0]?.message;
  
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
        (isTouched && error) && (
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
            if (!isTouched) setIsTouched(true);
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
            if (!isTouched) setIsTouched(true);
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
          if (!isTouched) setIsTouched(true);
          setInstruction((i) => ({
            ...i,
            description: e.target.value
          }));
        }}
        className="resize-y break-all"
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
          setIsTouched(false);
        }}
        className="mealicious-button font-semibold flex justify-center items-center gap-3 py-2 rounded-md"
      >
        Add Instruction
        <Plus size={18}/>
      </button>
      {
        formInstructionValues.length > 0 && (
          <>
          <Separator />
          <div className="flex items-center gap-2 text-sm">
            <Info size={16}/>
            <span className={cn(formInstructionValues.length > MAX_INSTRUCTIONS_LENGTH && "text-red-500")}>
              Instruction count: <b>{formInstructionValues.length}</b> / {MAX_INSTRUCTIONS_LENGTH}
            </span>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            { 
              formInstructionValues.map((i, index) => (
                <div
                  key={index}
                  className="flex flex-col items-start gap-3 text-left overflow-hidden border border-border rounded-md p-3 shadow-sm"
                >
                  <div className="w-full flex justify-between items-start gap-4">
                    <div className="mealicious-button size-10 flex justify-center items-center p-3 rounded-full">
                      {index + 1}
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5 items-start">
                      <h2 className="font-bold text-lg hyphens-auto line-clamp-2 -mt-1">{i.title}</h2>
                      <div className="font-semibold text-sm text-nowrap flex items-center gap-1.5 text-muted-foreground">
                        <Clock size={14}/>
                        {Math.floor(i.time)} mins
                      </div>
                    </div>
                  </div>
                  <p className="flex-1 text-left break-all">{i.description}</p>
                  <div className="w-full h-8 flex justify-between sm:justify-start items-center gap-3">
                    <button
                      type="button"
                      disabled={index <= 0}
                      onClick={() => swap(index, index - 1)}
                      className="flex-1 sm:flex-none shrink-0 mealicious-button font-semibold text-xs text-nowrap flex justify-center items-center gap-1.5 py-2 px-3 h-8 rounded-full"
                    >
                      <ArrowUp size={14}/>
                      Move Up
                    </button>
                    <button
                      type="button"
                      disabled={index >= formInstructionValues.length - 1}
                      onClick={() => swap(index, index + 1)}
                      className="flex-1 sm:flex-none shrink-0 mealicious-button font-semibold text-xs text-nowrap flex justify-center items-center gap-1.5 py-2 px-3 h-8 rounded-full"
                    >
                      <ArrowDown size={14}/>
                      Move Down
                    </button>
                    <Separator orientation="vertical" className="grow-0"/>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="group flex-1 sm:flex-none shrink-0 cursor-pointer hover:bg-red-700 hover:text-white hover:border-red-700 border border-muted-foreground font-semibold text-xs text-nowrap flex justify-center items-center gap-1.5 py-2 px-3 h-8 rounded-full transition-colors"
                    >
                      <Trash2 size={14} className="stroke-muted-foreground group-hover:stroke-white"/>
                      Delete
                    </button>
                  </div>
                </div>
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
