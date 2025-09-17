"use client";

import { ChangeDietPreferencesFormSchema, MAX_DIET_SCORE, type ChangeDietPreferencesForm } from "@/lib/zod/settings";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { Control, useFieldArray, useForm, UseFormSetValue, useFormState, useWatch } from "react-hook-form";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Info, LoaderCircle, Minus, Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { updateDietPreferences } from "@/lib/actions/settings";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type ChangeDietPreferencesFormProps = {
  dietPreferences: {
    id: string;
    name: string;
    description: string;
    score: number;
  }[];
};

const MAX_DIET_DISPLAY_LIMIT = 6;

export default function ChangeDietPreferencesForm({ dietPreferences }: ChangeDietPreferencesFormProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const {
    control,
    setValue,
    handleSubmit,
    reset,
    formState: {
      isDirty
    }
  } = useForm({
    resolver: zodResolver(ChangeDietPreferencesFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { preferences: dietPreferences }
  });

  const { fields } = useFieldArray({ control, name: "preferences" });

  const { execute, isExecuting } = useAction(updateDietPreferences, {
    onSuccess: async ({ data, input }) => {
      await queryClient.invalidateQueries({
        queryKey: ["search-recipes-results"]
      });
      reset(input);
      toast.success(data.message);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });
  
  return (
    <form onSubmit={handleSubmit(execute)} className="grid overflow-hidden">
      <h1 className="font-bold text-xl">Diet Preferences</h1>
      <p className="text-muted-foreground mb-1">Change your diet preferences here.</p>
      <div className="text-muted-foreground flex items-center gap-2">
        <Info size={16}/>
        <p className="text-muted-foreground font-light text-sm">These preferences can be applied when you search for new recipes.</p>
      </div>
      <Collapsible open={open} onOpenChange={setOpen} className="grid border border-border mt-4 rounded-md">
        <div className="grid">
          {
            fields.slice(0, MAX_DIET_DISPLAY_LIMIT).map((d, index) => (
              <DietPreference 
                key={d.id}
                index={index}
                control={control}
                setPreferenceValue={setValue}
              />
            ))
          }
        </div>
        <CollapsibleContent className="grid">
          {
            fields.slice(MAX_DIET_DISPLAY_LIMIT).map((d, index) => (
              <DietPreference 
                key={d.id}
                index={index + MAX_DIET_DISPLAY_LIMIT}
                control={control}
                setPreferenceValue={setValue}
              />
            ))
          }
        </CollapsibleContent>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full cursor-pointer flex justify-between items-center py-6! px-3! rounded-none">
            {open ? "Less Diets" : "More Diets"}
            {open ? <Minus /> : <Plus />}
          </Button>
        </CollapsibleTrigger>
        <div className={cn(
          "border-t border-t-border flex items-center gap-3 p-3",
          !isDirty && "hidden"
        )}>
          <button
            type="submit"
            disabled={isExecuting}
            className="mealicious-button w-20 flex justify-center items-center text-white text-sm font-semibold py-2 px-4 rounded-sm"
          >
            {isExecuting ? <LoaderCircle size={18} className="animate-spin"/> : "Submit"}
          </button>
          <Button
            type="button"
            variant="destructive"
            disabled={isExecuting}
            onClick={() => reset()}
            className="cursor-pointer rounded-sm"
          >
            Cancel
          </Button>
        </div>
      </Collapsible>
    </form>
  );
}

const DietPreference = memo(({
  index,
  control,
  setPreferenceValue
}: {
  index: number;
  control: Control<ChangeDietPreferencesForm>;
  setPreferenceValue: UseFormSetValue<ChangeDietPreferencesForm>;
}) => {
  const dietPreference = useWatch({ control, name: `preferences.${index}` });
  
  const { 
    errors: {
      preferences: preferencesError
    }
  } = useFormState({
    control,
    name: `preferences.${index}`
  });

  return (
    <div className="grid border-b border-b-border gap-2.5 p-4">
      <div className="flex items-center gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <Info size={16} className="cursor-pointer"/>
          </PopoverTrigger>
          <PopoverContent className="text-xs font-semibold text-muted-foreground p-3 text-wrap hyphens-auto" align="start">
            {dietPreference.description}
          </PopoverContent>
        </Popover>
        <h2 className="font-semibold text-sm">{dietPreference.name}</h2>
      </div>
      <div className="error-text text-xs has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{preferencesError?.[index]?.score?.message}</span>
      </div>
      <RadioGroup 
        value={String(dietPreference.score)}
        onValueChange={(val) => setPreferenceValue(
          `preferences.${index}.score`,
          Number(val),
          { shouldDirty: true }
        )}
        className="flex justify-between gap-2"
      >
        {
          Array.from({ length: MAX_DIET_SCORE + 1 }, (_, i) => String(i)).map((i) => (
            <Label 
              key={i}
              className={cn(
                "flex-1 cursor-pointer border border-muted-foreground/25 flex flex-col @min-2xl:flex-row justify-around items-center gap-2 rounded-sm py-2 px-3",
                "has-data-[state=checked]:pointer-events-none has-data-[state=checked]:border-mealicious-primary has-data-[state=checked]:bg-mealicious-primary/20"
              )}
            >
              <RadioGroupItem value={i} className="peer/radio-item"/>
              <span className="text-muted-foreground peer-data-[state=checked]/radio-item:text-primary">{i}</span>
            </Label>
          ))
        }
      </RadioGroup>
    </div>
  );
});

DietPreference.displayName = "DietPreference";
